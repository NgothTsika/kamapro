"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminToken } from "@/lib/admin-auth";
import {
  approveSubmission,
  getAdminReports,
  getAdminSubmissions,
  rejectSubmission,
  reviewAdminReport,
} from "@/lib/kama-api";
import type { AdminReportStatus, ModerationReport, ModerationSubmission } from "@/lib/kama-types";

export default function ModerationPage() {
  const [token, setToken] = useState<string | null>(null);
  const [reports, setReports] = useState<ModerationReport[]>([]);
  const [submissions, setSubmissions] = useState<ModerationSubmission[]>([]);
  const [reportStatusFilter, setReportStatusFilter] = useState<AdminReportStatus | "ALL">("ALL");
  const [rejectReason, setRejectReason] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  async function loadData(currentToken: string, reportStatus: AdminReportStatus | "ALL") {
    setLoading(true);
    try {
      const [reportData, submissionData] = await Promise.all([
        getAdminReports(currentToken, reportStatus === "ALL" ? undefined : reportStatus),
        getAdminSubmissions(currentToken, "PENDING"),
      ]);
      setReports(reportData.reports);
      setSubmissions(submissionData.submissions);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to load moderation data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const currentToken = getAdminToken();
    if (!currentToken) return;

    setToken(currentToken);
    void loadData(currentToken, reportStatusFilter);
  }, [reportStatusFilter]);

  async function onReportStatusChange(reportId: string, status: Exclude<AdminReportStatus, "OPEN">) {
    if (!token) return;

    try {
      await reviewAdminReport(token, reportId, status);
      toast.success(`Report marked as ${status}`);
      await loadData(token, reportStatusFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update report");
    }
  }

  async function onApproveSubmission(submissionId: string) {
    if (!token) return;
    try {
      await approveSubmission(token, submissionId);
      toast.success("Submission approved");
      await loadData(token, reportStatusFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to approve submission");
    }
  }

  async function onRejectSubmission(submissionId: string) {
    if (!token) return;

    const reason = rejectReason[submissionId]?.trim();
    if (!reason) {
      toast.error("Add a rejection reason first");
      return;
    }

    try {
      await rejectSubmission(token, submissionId, reason);
      toast.success("Submission rejected");
      await loadData(token, reportStatusFilter);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to reject submission");
    }
  }

  return (
    <Tabs defaultValue="reports" className="space-y-4">
      <TabsList>
        <TabsTrigger value="reports">Reports</TabsTrigger>
        <TabsTrigger value="submissions">Submissions</TabsTrigger>
      </TabsList>

      <TabsContent value="reports">
        <Card>
          <CardHeader>
            <CardTitle>Content Reports</CardTitle>
            <CardDescription>Review and resolve abuse or quality reports.</CardDescription>
            <div className="pt-2">
              <NativeSelect
                value={reportStatusFilter}
                onChange={(event) =>
                  setReportStatusFilter(event.target.value as AdminReportStatus | "ALL")
                }
              >
                <NativeSelectOption value="ALL">All statuses</NativeSelectOption>
                <NativeSelectOption value="OPEN">Open</NativeSelectOption>
                <NativeSelectOption value="IN_REVIEW">In review</NativeSelectOption>
                <NativeSelectOption value="RESOLVED">Resolved</NativeSelectOption>
                <NativeSelectOption value="DISMISSED">Dismissed</NativeSelectOption>
              </NativeSelect>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reason</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Target</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5}>Loading...</TableCell>
                  </TableRow>
                ) : reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>No reports found.</TableCell>
                  </TableRow>
                ) : (
                  reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.reason}</TableCell>
                      <TableCell>{report.reporter.username}</TableCell>
                      <TableCell>{report.lesson?.title ?? report.submission?.title ?? "Unknown"}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{report.status}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReportStatusChange(report.id, "IN_REVIEW")}
                          >
                            Review
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReportStatusChange(report.id, "RESOLVED")}
                          >
                            Resolve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onReportStatusChange(report.id, "DISMISSED")}
                          >
                            Dismiss
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="submissions">
        <Card>
          <CardHeader>
            <CardTitle>Pending Submissions</CardTitle>
            <CardDescription>Approve or reject community content submissions.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : submissions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending submissions.</p>
            ) : (
              submissions.map((submission) => (
                <div key={submission.id} className="rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{submission.title}</p>
                      <p className="text-sm text-muted-foreground">{submission.description}</p>
                    </div>
                    <Badge>{submission.status}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    by {submission.user.username} in {submission.category.name}
                  </p>
                  <Input
                    placeholder="Quick reject reason..."
                    value={rejectReason[submission.id] ?? ""}
                    onChange={(event) =>
                      setRejectReason((current) => ({
                        ...current,
                        [submission.id]: event.target.value,
                      }))
                    }
                  />
                  <Textarea
                    value={submission.content ?? ""}
                    readOnly
                    className="min-h-28"
                    placeholder="Submission content"
                  />
                  <div className="flex gap-2">
                    <Button onClick={() => onApproveSubmission(submission.id)}>Approve</Button>
                    <Button variant="destructive" onClick={() => onRejectSubmission(submission.id)}>
                      Reject
                    </Button>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
