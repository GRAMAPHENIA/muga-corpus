import mammoth from "mammoth";

export async function docxBufferToMarkdown(buffer: Buffer): Promise<string> {
  const { value } = await mammoth.convertToMarkdown({ buffer }, {
    includeDefaultStyleMap: false,
    styleMap: []
  });
  return value.trim();
}
