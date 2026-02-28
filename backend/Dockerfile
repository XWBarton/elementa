FROM python:3.12-slim

WORKDIR /app

# Install Typst for PDF generation (multi-arch: x86_64 and aarch64)
RUN apt-get update && apt-get install -y --no-install-recommends curl xz-utils && \
    ARCH=$(uname -m) && \
    if [ "$ARCH" = "x86_64" ]; then TYPST_ARCH="x86_64-unknown-linux-musl"; \
    elif [ "$ARCH" = "aarch64" ]; then TYPST_ARCH="aarch64-unknown-linux-musl"; \
    else echo "Unsupported arch: $ARCH" && exit 1; fi && \
    curl -fsSL "https://github.com/typst/typst/releases/download/v0.12.0/typst-${TYPST_ARCH}.tar.xz" \
      -o /tmp/typst.tar.xz && \
    tar -xJf /tmp/typst.tar.xz -C /tmp && \
    mv "/tmp/typst-${TYPST_ARCH}/typst" /usr/local/bin/typst && \
    rm -rf /tmp/typst* /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app/ ./app/

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
