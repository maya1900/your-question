type RichTextViewerProps = {
  content: string;
};

export function RichTextViewer({ content }: RichTextViewerProps) {
  return (
    <div
      className="rich-text-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
