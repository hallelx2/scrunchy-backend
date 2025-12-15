-- AlterTable
ALTER TABLE "_AssetToGame" ADD CONSTRAINT "_AssetToGame_AB_pkey" PRIMARY KEY ("A", "B");

-- DropIndex
DROP INDEX "_AssetToGame_AB_unique";
