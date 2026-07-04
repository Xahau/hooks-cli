interface FileObject {
  type: "c" | "h" | "js" | "ts";
  name: string;
  options?: string;
  src: string;
}
