"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuthStore } from "@/stores/useAuthStore";
import { api } from "@/lib/api";
import type { Listing, ProductQuestion, QuestionReply } from "@/types";

interface ProductQuestionsProps {
  listing: Listing;
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2);
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function ProductQuestions({ listing }: ProductQuestionsProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();

  const [questions, setQuestions] = useState<ProductQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmittingId, setReplySubmittingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    let cancelled = false;
    api
      .get<{ questions: ProductQuestion[] }>(
        `/listings/${listing.id}/questions`,
      )
      .then((res) => {
        if (!cancelled) setQuestions(res.questions);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [listing.id]);

  const requireAuth = () => {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/products/${listing.id}`);
      return false;
    }
    return true;
  };

  const handleAsk = async () => {
    const text = newQuestion.trim();
    if (!text) return;
    if (!requireAuth()) return;

    setSubmitting(true);
    try {
      const created = await api.post<ProductQuestion>(
        `/listings/${listing.id}/questions`,
        { text },
      );
      setQuestions((prev) => [created, ...prev]);
      setNewQuestion("");
      toast.success("Question posted");
    } catch {
      toast.error("Could not post your question");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (questionId: string) => {
    const text = replyText.trim();
    if (!text) return;
    if (!requireAuth()) return;

    setReplySubmittingId(questionId);
    try {
      const created = await api.post<QuestionReply>(
        `/questions/${questionId}/replies`,
        { text },
      );
      setQuestions((prev) =>
        prev.map((q) =>
          q.id === questionId
            ? { ...q, replies: [...q.replies, created] }
            : q,
        ),
      );
      setReplyText("");
      setReplyingTo(null);
      toast.success("Reply posted");
    } catch {
      toast.error("Could not post your reply");
    } finally {
      setReplySubmittingId(null);
    }
  };

  return (
    <section className="mt-0">
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="size-5 text-brand-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Questions &amp; comments
        </h2>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground-muted">
          {questions.length}
        </span>
      </div>

      {/* Ask a question */}
      <div className="rounded-lg border border-border bg-background p-3 sm:p-4">
        <Textarea
          placeholder="Ask the seller a question or leave a comment…"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          className="min-h-16 border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0"
        />
        <div className="mt-2 flex items-center justify-between gap-3">
          <p className="hidden text-xs text-foreground-faint sm:block">
            Be respectful — don&apos;t share personal details.
          </p>
          <Button
            size="sm"
            disabled={!newQuestion.trim() || submitting}
            onClick={handleAsk}
            className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover"
          >
            <Send className="size-3.5" />
            Ask question
          </Button>
        </div>
      </div>

      {/* Thread list */}
      <div className="mt-6">
        {loading ? (
          <div className="space-y-4 py-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2.5">
                <Skeleton className="size-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-1/3" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center">
            <p className="text-sm text-foreground-muted">
              Couldn&apos;t load questions.
            </p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        ) : questions.length === 0 ? (
          <p className="py-8 text-center text-sm text-foreground-muted">
            No questions yet — be the first to ask.
          </p>
        ) : (
          questions.map((q, i) => {
            const isSeller = q.author.id === listing.sellerId;
            return (
              <div key={q.id}>
                {i > 0 && <Separator />}
                <div className="py-4">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-brand-primary/10 text-brand-primary text-xs font-medium">
                        {initials(q.author.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <p className="text-sm font-medium text-foreground">
                        {q.author.name}
                      </p>
                      {isSeller && (
                        <Badge
                          variant="outline"
                          className="border-brand-primary/30 bg-brand-primary/5 text-[10px] text-brand-primary"
                        >
                          Seller
                        </Badge>
                      )}
                      <p className="text-xs text-foreground-faint">
                        {timeAgo(q.createdAt)}
                      </p>
                    </div>
                  </div>

                  <p className="mt-2 text-sm leading-relaxed text-foreground">
                    {q.text}
                  </p>

                  {/* Replies */}
                  {q.replies.map((r) => (
                    <div
                      key={r.id}
                      className="mt-3 ml-8 rounded-lg bg-surface-muted p-3 sm:ml-10"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                        <p className="text-sm font-medium text-foreground">
                          {r.author.name}
                        </p>
                        {r.author.id === listing.sellerId && (
                          <Badge
                            variant="outline"
                            className="border-brand-primary/30 bg-brand-primary/5 text-[10px] text-brand-primary"
                          >
                            Seller
                          </Badge>
                        )}
                        <p className="text-xs text-foreground-faint">
                          {timeAgo(r.createdAt)}
                        </p>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-foreground-muted">
                        {r.text}
                      </p>
                    </div>
                  ))}

                  {/* Reply toggle */}
                  {replyingTo === q.id ? (
                    <div className="mt-2 ml-8 sm:ml-10">
                      <Textarea
                        placeholder={`Reply to ${q.author.name}…`}
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        className="min-h-16 text-sm"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setReplyingTo(null);
                            setReplyText("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={
                            !replyText.trim() || replySubmittingId === q.id
                          }
                          onClick={() => handleReply(q.id)}
                          className="rounded bg-brand-primary text-white hover:bg-brand-primary-hover"
                        >
                          {replySubmittingId === q.id
                            ? "Posting…"
                            : "Reply"}
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setReplyingTo(q.id)}
                      className="mt-2 text-xs font-medium text-brand-primary hover:underline"
                    >
                      Reply
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
