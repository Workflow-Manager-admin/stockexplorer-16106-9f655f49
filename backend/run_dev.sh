#!/bin/bash
# Run FastAPI app locally for development (port 8000)
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
