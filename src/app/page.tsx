
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useDropzone } from "react-dropzone";
import { GoogleGenerativeAI } from "@google/generative-ai";

type DocumentResult = {
  fileName: string;
  fullText: string;
  summary: string;
  keyDetails: string[];
};

type VerificationResult = {
  field: string;
  matches: boolean;
  values: string[];
};

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<DocumentResult[]>([]);
  const [verification, setVerification] = useState<VerificationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;
  if (!apiKey) {
    console.error("API key is missing. Please check your .env.local file.");
  }
  const genAI = new GoogleGenerativeAI(apiKey || "");

  const onDrop = (acceptedFiles: File[]) => {
    setError(null);
    const pdfFiles = acceptedFiles.filter(file => file.type === "application/pdf");
    if (pdfFiles.length !== acceptedFiles.length) {
      setError("Only PDF files are accepted.");
    }
    if (pdfFiles.length < 2) {
      setError("Please upload at least two PDF files for comparison.");
      return;
    }
    setFiles(pdfFiles);
    console.log("Files selected:", pdfFiles.map(f => f.name));
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "application/pdf": [".pdf"] },
    multiple: true,
  });

  const processDocuments = async () => {
    if (files.length < 2) {
      setError("Please upload at least two PDF files.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults([]);
    setVerification([]);

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const prompt = `
        For this PDF document, provide:
        1. The full extracted text
        2. A brief summary (2-3 sentences) of what the document is about
        3. Extract key details including: Name, Address, Date of Birth, Identification Number (or any unique ID)
        4. ignore capitalization
        
        Format your response as:
        [FULL_TEXT]
        Full extracted text here...
        [/FULL_TEXT]
        
        [SUMMARY]
        Summary here...
        [/SUMMARY]
        
        [KEY_DETAILS]
        - Name: [extracted name]
        - Address: [extracted address]
        - Date of Birth: [extracted DOB]
        - Identification Number: [extracted ID]
        [/KEY_DETAILS]
      `;

      const docResults: DocumentResult[] = [];
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer();
        const base64String = Buffer.from(arrayBuffer).toString("base64");

        const fileData = {
          inlineData: {
            data: base64String,
            mimeType: "application/pdf",
          },
        };

        const result = await model.generateContent([prompt, fileData]);
        const responseText = result.response.text();

        const fullTextMatch = responseText.match(/\[FULL_TEXT\]([\s\S]*?)\[\/FULL_TEXT\]/);
        const summaryMatch = responseText.match(/\[SUMMARY\]([\s\S]*?)\[\/SUMMARY\]/);
        const keyDetailsMatch = responseText.match(/\[KEY_DETAILS\]([\s\S]*?)\[\/KEY_DETAILS\]/);

        const keyDetails = keyDetailsMatch
          ? keyDetailsMatch[1]
              .trim()
              .split("\n")
              .map((item) => item.trim().replace(/^- /, ""))
              .filter((item) => item)
          : ["No key details extracted"];

        docResults.push({
          fileName: file.name,
          fullText: fullTextMatch ? fullTextMatch[1].trim() : "No text extracted",
          summary: summaryMatch ? summaryMatch[1].trim() : "No summary generated",
          keyDetails,
        });
      }

      setResults(docResults);


      const verifyFields = ["Name", "Address", "Date of Birth", "Identification Number"];
      const verificationResults: VerificationResult[] = [];

      for (const field of verifyFields) {
        const values = docResults.map(result => {
          const detail = result.keyDetails.find(d => d.startsWith(`${field}:`));
          return detail ? detail.replace(`${field}: `, "").trim() : "Not found";
        });

        const matches = values.every((val, _, arr) => val === arr[0] && val !== "Not found");
        verificationResults.push({ field, matches, values });
      }

      setVerification(verificationResults);
    } catch (error) {
      console.error("Processing error:", error);
      setError(`Failed to process documents: ${error instanceof Error ? error.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Multiple PDF Extractor & Verifier</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed p-8 text-center rounded-lg cursor-pointer ${
              isDragActive ? "border-primary bg-primary/10" : "border-gray-300"
            }`}
          >
            <input {...getInputProps()} />
            {files.length > 0 ? (
              <p className="text-sm">Selected: {files.map(f => f.name).join(", ")}</p>
            ) : (
              <p className="text-sm">
                Drag and drop multiple PDFs here, or click to select (minimum 2)
              </p>
            )}
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <Button
            onClick={processDocuments}
            disabled={files.length < 2 || loading}
            className="w-full"
          >
            {loading ? "Processing..." : "Extract & Verify"}
          </Button>

          {results.length > 0 && (
            <div className="space-y-8">
              <div className="space-y-4">
                <Label className="text-lg">Verification Results:</Label>
                <div className="p-4 bg-gray-50 rounded-lg">
                  {verification.map((v, index) => (
                    <p key={index} className={`text-sm ${v.matches ? "text-green-600" : "text-red-600"}`}>
                      <strong>{v.field}:</strong> {v.matches ? "Matches" : "Does not match"} 
                      ({v.values.join(" | ")})
                    </p>
                  ))}
                </div>
              </div>

              {results.map((result, index) => (
                <div key={index} className="space-y-4">
                  <h3 className="text-lg font-semibold">{result.fileName}</h3>
                  <div className="space-y-2">
                    <Label>Summary:</Label>
                    <div className="p-3 bg-gray-50 rounded-lg text-sm">{result.summary}</div>
                  </div>
                  <div className="space-y-2">
                    <Label>Key Details:</Label>
                    <ul className="list-disc pl-5 text-sm bg-gray-50 p-3 rounded-lg">
                      {result.keyDetails.map((detail, i) => (
                        <li key={i}>{detail}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <Label>Full Extracted Text:</Label>
                    <Textarea
                      value={result.fullText}
                      readOnly
                      className="min-h-[150px] font-mono text-sm"
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}