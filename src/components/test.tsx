// "use client";

// import { useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Label } from "@/components/ui/label";
// import { Textarea } from "@/components/ui/textarea";
// import { useDropzone } from "react-dropzone";
// import { GoogleGenerativeAI } from "@google/generative-ai";

// export default function Home() {
//   const [file, setFile] = useState<File | null>(null);
//   const [extractedText, setExtractedText] = useState("");
//   const [summary, setSummary] = useState("");
//   const [keyDetails, setKeyDetails] = useState<string[]>([]);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string | null>(null);

//   
//   const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
//   if (!apiKey) {
//     console.error("API key is missing. Please check your .env.local file.");
//   }
//   const genAI = new GoogleGenerativeAI(apiKey || "");

//   const onDrop = (acceptedFiles: File[]) => {
//     setError(null);
//     if (acceptedFiles.length === 0) {
//       setError("No files were accepted. Please upload a PDF.");
//       return;
//     }
    
//     const selectedFile = acceptedFiles[0];
//     if (selectedFile.type !== "application/pdf") {
//       setError("Please upload a PDF file only.");
//       return;
//     }
    
//     setFile(selectedFile);
//     console.log("File selected:", selectedFile.name);
//   };

//   const { getRootProps, getInputProps, isDragActive } = useDropzone({
//     onDrop,
//     accept: { "application/pdf": [".pdf"] },
//     maxFiles: 1,
//     multiple: false,
//   });

//   const extractText = async () => {
//     if (!file) {
//       setError("No file selected. Please upload a PDF first.");
//       return;
//     }

//     setLoading(true);
//     setError(null);
//     try {
//       // Read file as ArrayBuffer
//       const arrayBuffer = await file.arrayBuffer();
//       const base64String = Buffer.from(arrayBuffer).toString("base64");

//       const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      
//       const prompt = `
//         Analyze this PDF document and provide:
//         1. The full extracted text
//         2. A brief summary (2-3 sentences) of what the document is about
//         3. 3-5 key details or facts from the document as concise bullet points
        
//         Format your response as:
//         [FULL_TEXT]
//         Full extracted text here...
//         [/FULL_TEXT]
        
//         [SUMMARY]
//         Summary here...
//         [/SUMMARY]
        
//         [KEY_DETAILS]
//         - Detail 1
//         - Detail 2
//         - Detail 3
//         [/KEY_DETAILS]
//       `;
      
//       const fileData = {
//         inlineData: {
//           data: base64String,
//           mimeType: "application/pdf",
//         },
//       };

//       const result = await model.generateContent([prompt, fileData]);
//       const responseText = result.response.text();

//       
//       const fullTextMatch = responseText.match(/\[FULL_TEXT\]([\s\S]*?)\[\/FULL_TEXT\]/);
//       const summaryMatch = responseText.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
//       const keyDetailsMatch = responseText.match(/\[KEY_DETAILS\]([\s\S]*?)\[\/KEY_DETAILS\]/);

//       setExtractedText(fullTextMatch ? fullTextMatch[1].trim() : "No text extracted");
//       setSummary(summaryMatch ? summaryMatch[1].trim() : "No summary generated");
//       setKeyDetails(
//         keyDetailsMatch
//           ? keyDetailsMatch[1]
//               .trim()
//               .split("\n")
//               .map((item) => item.trim().replace(/^- /, ""))
//               .filter((item) => item)
//           : ["No key details extracted"]
//       );
//     } catch (error) {
//       console.error("Extraction error:", error);
//       setError(`Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
//       setExtractedText("");
//       setSummary("");
//       setKeyDetails([]);
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="container mx-auto p-4 max-w-3xl">
//       <Card>
//         <CardHeader>
//           <CardTitle>PDF Text Extractor</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div
//             {...getRootProps()}
//             className={`border-2 border-dashed p-8 text-center rounded-lg cursor-pointer ${
//               isDragActive ? "border-primary bg-primary/10" : "border-gray-300"
//             }`}
//           >
//             <input {...getInputProps()} />
//             {file ? (
//               <p className="text-sm">Selected: {file.name}</p>
//             ) : (
//               <p className="text-sm">
//                 Drag and drop a PDF here, or click to select
//               </p>
//             )}
//           </div>

//           {error && (
//             <p className="text-red-500 text-sm">{error}</p>
//           )}

//           <Button
//             onClick={extractText}
//             disabled={!file || loading}
//             className="w-full"
//           >
//             {loading ? "Processing..." : "Extract & Summarize"}
//           </Button>

//           {(extractedText || summary || keyDetails.length > 0) && (
//             <div className="space-y-6">
//               {summary && (
//                 <div className="space-y-2">
//                   <Label>Summary:</Label>
//                   <div className="p-3 bg-gray-50 rounded-lg text-sm">
//                     {summary}
//                   </div>
//                 </div>
//               )}

//               {keyDetails.length > 0 && (
//                 <div className="space-y-2">
//                   <Label>Key Details:</Label>
//                   <ul className="list-disc pl-5 text-sm bg-gray-50 p-3 rounded-lg">
//                     {keyDetails.map((detail, index) => (
//                       <li key={index}>{detail}</li>
//                     ))}
//                   </ul>
//                 </div>
//               )}

//               {extractedText && (
//                 <div className="space-y-2">
//                   <Label>Full Extracted Text:</Label>
//                   <Textarea
//                     value={extractedText}
//                     readOnly
//                     className="min-h-[200px] font-mono text-sm"
//                   />
//                 </div>
//               )}
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

