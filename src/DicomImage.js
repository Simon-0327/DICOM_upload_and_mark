import * as cornerstone from "cornerstone-core";
import * as cornerstoneWADOImageLoader from "cornerstone-wado-image-loader";
import * as dicomParser from "dicom-parser";

cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;

export async function renderDicomImage(element, file) {
  if (!element || !file) return;

  const imageId = cornerstoneWADOImageLoader.wadouri.fileManager.add(file);

  cornerstone.enable(element);
  const image = await cornerstone.loadAndCacheImage(imageId);
  cornerstone.displayImage(element, image);

  return image;
}
