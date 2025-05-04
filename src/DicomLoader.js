import * as dcmjs from "dcmjs";

export async function loadDicomFile(file) {
  if (!file) return null;

  const arrayBuffer = await file.arrayBuffer();
  const dicomData = dcmjs.data.DicomMessage.readFile(arrayBuffer);
  const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(dicomData.dict);

  const info = {
    name: String(dataset.PatientName?.Alphabetic),
    birthDate: dataset.PatientBirthDate,
    age: dataset.PatientAge,
    sex: dataset.PatientSex,
  };

  return info;
}
