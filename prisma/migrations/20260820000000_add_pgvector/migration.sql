CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "ProductEmbedding" (
    "productId" TEXT NOT NULL,
    "embedding" vector(384) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductEmbedding_pkey" PRIMARY KEY ("productId"),
    CONSTRAINT "ProductEmbedding_productId_fkey"
        FOREIGN KEY ("productId")
        REFERENCES "Product"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);
