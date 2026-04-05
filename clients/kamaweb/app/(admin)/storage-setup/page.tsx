// "use client";

// import { useEffect, useState } from "react";
// import { Button } from "@/components/ui/button";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
// import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

// interface BucketStatus {
//   name: string;
//   status: "created" | "exists" | "error" | "pending";
//   message: string;
// }

// export default function StorageSetupPage() {
//   const [isInitializing, setIsInitializing] = useState(false);
//   const [buckets, setBuckets] = useState<BucketStatus[]>([]);
//   const [error, setError] = useState<string | null>(null);
//   const [sqlSteps, setSqlSteps] = useState<string[] | null>(null);

//   const initializeBuckets = async () => {
//     setIsInitializing(true);
//     setError(null);
//     setBuckets([
//       {
//         name: "lesson-covers",
//         status: "pending",
//         message: "Creating bucket...",
//       },
//       {
//         name: "chapter-media",
//         status: "pending",
//         message: "Creating bucket...",
//       },
//       {
//         name: "character-images",
//         status: "pending",
//         message: "Creating bucket...",
//       },
//       {
//         name: "quiz-media",
//         status: "pending",
//         message: "Creating bucket...",
//       },
//     ]);

//     try {
//       const apiUrl =
//         process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1" || "https://kamapro-one.vercel.app/api/v1";
//       const response = await fetch(`${apiUrl}/storage/init`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.error || "Failed to initialize buckets");
//       }

//       const data = await response.json();
//       setBuckets(data.results || []);
//     } catch (err) {
//       setError(err instanceof Error ? err.message : "Unknown error occurred");
//       setBuckets([
//         {
//           name: "lesson-covers",
//           status: "error",
//           message: err instanceof Error ? err.message : "Failed to create",
//         },
//         {
//           name: "chapter-media",
//           status: "error",
//           message: err instanceof Error ? err.message : "Failed to create",
//         },
//         {
//           name: "character-images",
//           status: "error",
//           message: err instanceof Error ? err.message : "Failed to create",
//         },
//         {
//           name: "quiz-media",
//           status: "error",
//           message: err instanceof Error ? err.message : "Failed to create",
//         },
//       ]);
//     } finally {
//       setIsInitializing(false);
//     }
//   };

//   const getStatusIcon = (status: string) => {
//     switch (status) {
//       case "created":
//       case "exists":
//         return <CheckCircle2 className="size-5 text-green-600" />;
//       case "error":
//         return <AlertCircle className="size-5 text-red-600" />;
//       case "pending":
//         return <Loader2 className="size-5 text-blue-600 animate-spin" />;
//       default:
//         return null;
//     }
//   };

//   const getStatusColor = (status: string) => {
//     switch (status) {
//       case "created":
//       case "exists":
//         return "bg-green-100 text-green-800";
//       case "error":
//         return "bg-red-100 text-red-800";
//       case "pending":
//         return "bg-blue-100 text-blue-800";
//       default:
//         return "bg-gray-100 text-gray-800";
//     }
//   };

//   const disableRLS = async () => {
//     setIsInitializing(true);
//     setError(null);
//     setSqlSteps(null);

//     try {
//       const apiUrl =
//         process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1" || "https://kamapro-one.vercel.app/api/v1";
//       const response = await fetch(`${apiUrl}/storage/disable-rls`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.error || "Failed to disable RLS");
//       }

//       const data = await response.json();
//       setBuckets(data.results || []);

//       // Display SQL steps for user to execute
//       if (data.steps) {
//         setSqlSteps(data.steps);
//       }
//     } catch (err) {
//       const errorMsg =
//         err instanceof Error ? err.message : "Unknown error occurred";
//       setError(errorMsg);
//     } finally {
//       setIsInitializing(false);
//     }
//   };

//   const fixAllRLS = async () => {
//     setIsInitializing(true);
//     setError(null);
//     setBuckets([
//       {
//         name: "lesson-covers",
//         status: "pending",
//         message: "Fixing RLS policies...",
//       },
//       {
//         name: "chapter-media",
//         status: "pending",
//         message: "Fixing RLS policies...",
//       },
//       {
//         name: "character-images",
//         status: "pending",
//         message: "Fixing RLS policies...",
//       },
//       {
//         name: "quiz-media",
//         status: "pending",
//         message: "Fixing RLS policies...",
//       },
//     ]);

//     try {
//       const apiUrl =
//         process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api/v1" || "https://kamapro-one.vercel.app/api/v1";
//       const response = await fetch(`${apiUrl}/storage/fix-all`, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//       });

//       if (!response.ok) {
//         const data = await response.json();
//         throw new Error(data.error || "Failed to fix RLS policies");
//       }

//       const data = await response.json();

//       // Show instructions for manual RLS disable
//       if (data.manualStepsRequired) {
//         setError(null);
//         alert(
//           `✓ Buckets configured!\n\nManual Steps Required:\n\n${data.manualSteps.join("\n")}`,
//         );
//       }

//       setBuckets(data.results?.init || []);
//     } catch (err) {
//       const errorMsg =
//         err instanceof Error ? err.message : "Unknown error occurred";
//       setError(errorMsg);
//       alert(
//         `Error: ${errorMsg}\n\nManual fix:\n1. Go to https://app.supabase.com\n2. Select your project\n3. Go to Authentication > Policies\n4. Find storage.objects table\n5. Delete all RLS policies for storage buckets`,
//       );
//     } finally {
//       setIsInitializing(false);
//     }
//   };

//   return (
//     <div className="space-y-6 p-6 max-w-2xl mx-auto">
//       <div>
//         <h1 className="text-3xl font-bold">Storage Setup</h1>
//         <p className="text-muted-foreground mt-2">
//           Initialize Supabase storage buckets for image and video uploads
//         </p>
//       </div>

//       <Card>
//         <CardHeader>
//           <CardTitle>Storage Buckets</CardTitle>
//           <CardDescription>
//             Create and configure storage buckets for your media files
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-6">
//           <div className="flex flex-col sm:flex-row gap-3">
//             <Button
//               onClick={initializeBuckets}
//               disabled={isInitializing}
//               size="lg"
//               className="w-full sm:w-auto"
//             >
//               {isInitializing ? (
//                 <>
//                   <Loader2 className="mr-2 size-4 animate-spin" />
//                   Initializing...
//                 </>
//               ) : (
//                 "Initialize Buckets"
//               )}
//             </Button>
//             <Button
//               onClick={fixAllRLS}
//               disabled={isInitializing || buckets.length === 0}
//               size="lg"
//               variant="secondary"
//               className="w-full sm:w-auto"
//             >
//               {isInitializing ? (
//                 <>
//                   <Loader2 className="mr-2 size-4 animate-spin" />
//                   Fixing RLS...
//                 </>
//               ) : (
//                 "Fix RLS Policies"
//               )}
//             </Button>
//             <Button
//               onClick={disableRLS}
//               disabled={isInitializing || buckets.length === 0}
//               size="lg"
//               variant="destructive"
//               className="w-full sm:w-auto"
//             >
//               {isInitializing ? (
//                 <>
//                   <Loader2 className="mr-2 size-4 animate-spin" />
//                   Disabling RLS...
//                 </>
//               ) : (
//                 "Disable RLS (Advanced)"
//               )}
//             </Button>
//           </div>

//           {error && (
//             <div className="bg-red-50 border border-red-200 rounded-lg p-4">
//               <p className="text-sm font-medium text-red-800">Error</p>
//               <p className="text-sm text-red-700 mt-1">{error}</p>
//             </div>
//           )}

//           {buckets.length > 0 && (
//             <div className="space-y-3">
//               <h3 className="font-medium">Bucket Status</h3>
//               {buckets.map((bucket) => (
//                 <div
//                   key={bucket.name}
//                   className="flex items-center justify-between p-4 border rounded-lg"
//                 >
//                   <div className="flex items-center gap-3">
//                     {getStatusIcon(bucket.status)}
//                     <div>
//                       <p className="font-medium text-sm">{bucket.name}</p>
//                       <p className="text-xs text-muted-foreground">
//                         {bucket.message}
//                       </p>
//                     </div>
//                   </div>
//                   <Badge className={getStatusColor(bucket.status)}>
//                     {bucket.status}
//                   </Badge>
//                 </div>
//               ))}
//             </div>
//           )}

//           <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
//             <h4 className="font-medium text-sm text-blue-900 mb-2">
//               About Storage Buckets
//             </h4>
//             <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
//               <li>
//                 <strong>lesson-covers</strong> - Lesson and category cover
//                 images
//               </li>
//               <li>
//                 <strong>chapter-media</strong> - Chapter images and videos
//               </li>
//               <li>
//                 <strong>character-images</strong> - Character portrait and
//                 invention images
//               </li>
//               <li>
//                 <strong>quiz-media</strong> - Quiz related media (for future
//                 use)
//               </li>
//             </ul>
//           </div>

//           <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
//             <h4 className="font-medium text-sm text-amber-900 mb-2">
//               Troubleshooting
//             </h4>
//             <ul className="text-sm text-amber-800 space-y-1">
//               <li>✓ Ensure server is running on localhost:4000</li>
//               <li>
//                 ✓ Check that Supabase credentials are correctly set in .env
//               </li>
//               <li>✓ Verify CORS is configured in Supabase dashboard</li>
//               <li>✓ Try refreshing the page after successful initialization</li>
//             </ul>
//           </div>

//           {sqlSteps && (
//             <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
//               <h4 className="font-medium text-sm text-amber-900 mb-3">
//                 🔧 Execute SQL Command in Supabase
//               </h4>
//               <p className="text-sm text-amber-800 mb-3">
//                 Copy the command below and run it in your Supabase SQL Editor to
//                 disable RLS:
//               </p>
//               <ol className="text-sm text-amber-800 space-y-2 list-decimal list-inside">
//                 {sqlSteps.map((step, idx) => (
//                   <li key={idx}>{step}</li>
//                 ))}
//               </ol>
//               <div className="mt-4 p-3 bg-white border border-amber-300 rounded font-mono text-xs overflow-x-auto">
//                 <code>
//                   ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
//                 </code>
//               </div>
//               <button
//                 onClick={() => {
//                   navigator.clipboard.writeText(
//                     "ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;",
//                   );
//                   alert("✓ SQL command copied to clipboard!");
//                 }}
//                 className="mt-3 px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700 transition"
//               >
//                 📋 Copy SQL Command
//               </button>
//             </div>
//           )}
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
