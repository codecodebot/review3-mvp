"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { createReviewAction } from "@/app/actions/reviews";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  PRICE_SATISFACTION,
  PRICE_SATISFACTION_LABELS,
  VISIT_TYPES,
  VISIT_TYPE_LABELS
} from "@/lib/constants";
import { calculateReviewScore } from "@/lib/scoring";

type ReviewFormProps = {
  storeId: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "제출 중..." : "리뷰 제출"}
    </Button>
  );
}

export function ReviewForm({ storeId }: ReviewFormProps) {
  const [tasteScore, setTasteScore] = useState(3);
  const [serviceScore, setServiceScore] = useState(3);
  const [environmentScore, setEnvironmentScore] = useState(3);

  const reviewScore = useMemo(
    () => calculateReviewScore(tasteScore, serviceScore, environmentScore),
    [tasteScore, serviceScore, environmentScore]
  );
  const requiresHighScoreReason = reviewScore >= 4.5;

  return (
    <Card>
      <CardHeader>
        <CardTitle>리뷰 작성</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createReviewAction} className="space-y-5">
          <input type="hidden" name="store_id" value={storeId} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="taste_score">맛</Label>
              <Input
                id="taste_score"
                name="taste_score"
                type="number"
                min={1}
                max={5}
                value={tasteScore}
                onChange={(event) => setTasteScore(Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="service_score">서비스</Label>
              <Input
                id="service_score"
                name="service_score"
                type="number"
                min={1}
                max={5}
                value={serviceScore}
                onChange={(event) => setServiceScore(Number(event.target.value))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="environment_score">공간</Label>
              <Input
                id="environment_score"
                name="environment_score"
                type="number"
                min={1}
                max={5}
                value={environmentScore}
                onChange={(event) => setEnvironmentScore(Number(event.target.value))}
                required
              />
            </div>
          </div>

          <div className="rounded-md border bg-muted p-3 text-sm">
            계산된 리뷰 점수: <strong>{reviewScore.toFixed(2)}</strong>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review_text">리뷰 내용</Label>
            <Textarea id="review_text" name="review_text" placeholder="무엇이 인상적이었나요?" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="visit_type">방문 유형</Label>
              <Select id="visit_type" name="visit_type" defaultValue="friends">
                {VISIT_TYPES.map((visitType) => (
                  <option key={visitType} value={visitType}>
                    {VISIT_TYPE_LABELS[visitType]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_satisfaction">가격 만족도</Label>
              <Select id="price_satisfaction" name="price_satisfaction" defaultValue="fair">
                {PRICE_SATISFACTION.map((value) => (
                  <option key={value} value={value}>
                    {PRICE_SATISFACTION_LABELS[value]}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_url">사진 URL</Label>
            <Input id="photo_url" name="photo_url" type="url" placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="high_score_reason">
              고득점 이유 {requiresHighScoreReason ? "(필수)" : "(선택)"}
            </Label>
            <Textarea
              id="high_score_reason"
              name="high_score_reason"
              required={requiresHighScoreReason}
              placeholder="계산된 리뷰 점수가 4.5 이상이면 필수입니다."
            />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
