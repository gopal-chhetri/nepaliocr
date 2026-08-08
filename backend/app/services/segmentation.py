import logging

import numpy as np
import cv2

logger = logging.getLogger(__name__)

MIN_LINE_AREA = 500
PAD = 4


def decode_image(data: bytes) -> np.ndarray:
    arr = np.frombuffer(data, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if img is None:
        raise ValueError("Could not decode image")
    return img


def _best_angle(gray: np.ndarray) -> float:
    bin_img = (gray < 128).astype(np.float32)
    h, w = bin_img.shape
    center = (w / 2, h / 2)
    best_angle, best_score = 0.0, -1.0
    for a in np.arange(-5, 6, 1):
        M = cv2.getRotationMatrix2D(center, float(a), 1.0)
        rot = cv2.warpAffine(bin_img, M, (w, h), flags=cv2.INTER_CUBIC, borderValue=0)
        hist = np.sum(rot, axis=1)
        score = float(np.square(hist[1:] - hist[:-1]).sum())
        if score > best_score:
            best_score, best_angle = score, float(a)
    return best_angle


def _rotate_bgr(img: np.ndarray, angle: float) -> np.ndarray:
    if not angle:
        return img
    h, w = img.shape[:2]
    M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
    return cv2.warpAffine(
        img, M, (w, h), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_CONSTANT, borderValue=(255, 255, 255)
    )


def segment_lines(image_bytes: bytes, max_width: int = 1000) -> list[dict]:
    """Deskew + denoise, split into line crops, return list of {bbox, data}."""
    img = decode_image(image_bytes)

    h, w = img.shape[:2]
    if w > max_width:
        img = cv2.resize(img, (max_width, int(h * max_width / w)), interpolation=cv2.INTER_AREA)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    denoised = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)

    angle = _best_angle(denoised)
    if angle:
        logger.info(f"Deskewing by {angle:.1f} deg")
        img = _rotate_bgr(img, angle)
        denoised = cv2.fastNlMeansDenoising(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), None, 10, 7, 21)

    _, thresh_inv = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    _, thresh_fwd = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    fwd_frac = float(np.count_nonzero(thresh_fwd)) / denoised.size
    inv_frac = float(np.count_nonzero(thresh_inv)) / denoised.size

    if inv_frac == 0 or fwd_frac == 0:
        thresh = thresh_inv if inv_frac else thresh_fwd
    else:
        thresh = thresh_inv if abs(inv_frac - 0.20) <= abs(fwd_frac - 0.20) else thresh_fwd

    h, w = denoised.shape[:2]
    kernel = np.ones((1, max(8, w // 12)), np.uint8)
    dilated = cv2.dilate(thresh, kernel, iterations=1)
    contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)

    boxes = []
    for c in contours:
        if cv2.contourArea(c) < MIN_LINE_AREA:
            continue
        x, y, bw, bh = cv2.boundingRect(c)
        boxes.append({"x": int(x), "y": int(y), "w": int(bw), "h": int(bh)})
    boxes.sort(key=lambda b: b["y"])

    H, W = img.shape[:2]
    results = []
    for box in boxes:
        x1 = max(0, box["x"] - PAD)
        y1 = max(0, box["y"] - PAD)
        x2 = min(W, box["x"] + box["w"] + PAD)
        y2 = min(H, box["y"] + box["h"] + PAD)
        crop = img[y1:y2, x1:x2]
        ok, buf = cv2.imencode(".jpg", crop, [cv2.IMWRITE_JPEG_QUALITY, 92])
        if not ok:
            continue
        results.append({"bbox": box, "data": buf.tobytes()})

    logger.info(f"Segmented {len(results)} line(s)")
    return results