/* // utils/uploadImage.js
import { ref, uploadBytes, updateMetadata, getDownloadURL } from "firebase/storage";
import { storage } from "../firebase"; 

export async function uploadImage(file) {
  try {
    const filename = `${Date.now()}_${file.name}`;
    const storageRef = ref(storage, `images/${filename}`);

    // 1. Ladda upp filen
    await uploadBytes(storageRef, file);

    // 2. Sätt metadata: Cache-control
    await updateMetadata(storageRef, {
      cacheControl: "public,max-age=31536000"
    });

    // 3. Hämta tillgänglig URL
    const url = await getDownloadURL(storageRef);

    return url;
  } catch (error) {
    console.error("Image upload failed:", error);
    throw error;
  }
}
 */