import logging
import os
from logging.handlers import RotatingFileHandler

from app.core.config import settings


def setup_logging():
    handlers: list[logging.Handler] = [logging.StreamHandler()]
    # In containers, stdout is collected by Docker; a file inside the
    # container would vanish on restart. Keep the file log for local runs.
    if settings.ENVIRONMENT.lower() != "production":
        log_dir = "logs"
        os.makedirs(log_dir, exist_ok=True)
        handlers.append(
            RotatingFileHandler(os.path.join(log_dir, "app.log"), maxBytes=1024 * 1024, backupCount=5)
        )

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=handlers,
    )
    return logging.getLogger(__name__)
