import { NextResponse } from "next/server";
import { HttpError, withUser } from "@/lib/api";
import { fileToHtml, ImportError, MAX_IMPORT_BYTES } from "@/lib/import";

/**
 * Converts an uploaded file to HTML and returns it. The client parses the HTML
 * against the editor schema and creates the document via POST /api/documents.
 */
export const POST = withUser(async (req) => {
  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    throw new HttpError(400, "Upload a file using multipart/form-data.");
  }
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "Choose a file to upload.");
  if (file.size > MAX_IMPORT_BYTES) throw new HttpError(413, "File is larger than 2 MB.");

  try {
    const result = await fileToHtml(file.name, Buffer.from(await file.arrayBuffer()));
    return NextResponse.json(result);
  } catch (err) {
    if (err instanceof ImportError) throw new HttpError(422, err.message);
    throw err;
  }
});
