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
import { PRICE_SATISFACTION, REVISIT_INTENTS, VISIT_TYPES } from "@/lib/constants";
import { calculateReviewScore } from "@/lib/scoring";

type ReviewFormProps = {
  storeId: string;
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit review"}
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
        <CardTitle>Write Review</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={createReviewAction} className="space-y-5">
          <input type="hidden" name="store_id" value={storeId} />
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="taste_score">Taste</Label>
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
              <Label htmlFor="service_score">Service</Label>
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
              <Label htmlFor="environment_score">Environment</Label>
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
            Calculated individual review score: <strong>{reviewScore.toFixed(2)}</strong>
          </div>

          <div className="space-y-2">
            <Label htmlFor="review_text">Review text</Label>
            <Textarea id="review_text" name="review_text" placeholder="What stood out?" />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="revisit_intent">Revisit intent</Label>
              <Select id="revisit_intent" name="revisit_intent" defaultValue="unsure">
                {REVISIT_INTENTS.map((intent) => (
                  <option key={intent} value={intent}>
                    {intent}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="visit_type">Visit type</Label>
              <Select id="visit_type" name="visit_type" defaultValue="friends">
                {VISIT_TYPES.map((visitType) => (
                  <option key={visitType} value={visitType}>
                    {visitType}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="price_satisfaction">Price satisfaction</Label>
              <Select id="price_satisfaction" name="price_satisfaction" defaultValue="fair">
                {PRICE_SATISFACTION.map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="photo_url">Photo URL</Label>
            <Input id="photo_url" name="photo_url" type="url" placeholder="https://..." />
          </div>

          <div className="space-y-2">
            <Label htmlFor="high_score_reason">
              High-score reason {requiresHighScoreReason ? "(required)" : "(optional)"}
            </Label>
            <Textarea
              id="high_score_reason"
              name="high_score_reason"
              required={requiresHighScoreReason}
              placeholder="Required when the calculated review score is 4.5 or higher."
            />
          </div>

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
