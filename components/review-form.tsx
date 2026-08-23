"use client";

import { useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, ImagePlus, MessageSquareText, SlidersHorizontal } from "lucide-react";
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
    <Button type="submit" disabled={pending} size="lg" className="tt-review-submit__button">
      {pending ? "리뷰를 저장하는 중" : "리뷰 제출"}
    </Button>
  );
}

function ScoreControl({
  id,
  name,
  label,
  value,
  onChange
}: {
  id: string;
  name: string;
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <fieldset className="tt-rating-control">
      <legend className="tt-rating-control__legend">
        <span>{label}</span>
        <strong>{value}.0</strong>
      </legend>
      <input type="hidden" id={id} name={name} value={value} />
      <div className="tt-rating-control__options" aria-label={`${label} 점수`}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={score === value ? "tt-rating-control__option is-active" : "tt-rating-control__option"}
            onClick={() => onChange(score)}
            aria-pressed={score === value}
          >
            {score}
          </button>
        ))}
      </div>
    </fieldset>
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

  return (
    <Card className="tt-review-form-card">
      <CardHeader>
        <p className="tt-kicker">Structured review</p>
        <CardTitle>방문 경험을 항목별로 남겨주세요</CardTitle>
        <div className="tt-form-progress" aria-label="리뷰 작성 단계">
          <span className="is-active">1. 점수</span>
          <span>2. 내용</span>
          <span>3. 방문 정보</span>
        </div>
      </CardHeader>
      <CardContent>
        <form action={createReviewAction} className="tt-form-stack">
          <input type="hidden" name="store_id" value={storeId} />
          <section className="tt-form-section" aria-labelledby="score-section-title">
            <div className="tt-form-section__heading">
              <SlidersHorizontal aria-hidden="true" />
              <div>
                <h2 id="score-section-title">항목별 점수</h2>
                <p>별점 대신 숫자로 정확하게 선택합니다.</p>
              </div>
            </div>
            <div className="tt-form-grid-3">
              <ScoreControl id="taste_score" name="taste_score" label="맛" value={tasteScore} onChange={setTasteScore} />
              <ScoreControl id="service_score" name="service_score" label="서비스" value={serviceScore} onChange={setServiceScore} />
              <ScoreControl id="environment_score" name="environment_score" label="분위기" value={environmentScore} onChange={setEnvironmentScore} />
            </div>
            <div className="tt-score-callout">
              <span>현재 리뷰 점수</span>
              <strong>{reviewScore.toFixed(2)}</strong>
            </div>
          </section>

          <section className="tt-form-section" aria-labelledby="text-section-title">
            <div className="tt-form-section__heading">
              <MessageSquareText aria-hidden="true" />
              <div>
                <h2 id="text-section-title">방문 내용</h2>
                <p>좋았던 점과 아쉬웠던 점을 같은 비중으로 확인합니다.</p>
              </div>
            </div>
            <div className="tt-form-grid-2">
              <div className="tt-field tt-review-text-field tt-review-text-field--positive">
                <Label htmlFor="positive_text">좋았던 점</Label>
                <Textarea id="positive_text" name="positive_text" placeholder="기억에 남은 장점을 구체적으로 적어주세요." rows={5} />
                <p className="tt-helper-text">맛, 응대, 공간 중 실제 경험한 내용을 권장합니다.</p>
              </div>
              <div className="tt-field tt-review-text-field tt-review-text-field--caution">
                <Label htmlFor="negative_text">아쉬웠던 점</Label>
                <Textarea id="negative_text" name="negative_text" placeholder="개선되면 좋을 점을 구체적으로 적어주세요." rows={5} />
                <p className="tt-helper-text">비난보다 당시 상황을 사실 위주로 적어주세요.</p>
              </div>
            </div>
          </section>

          <section className="tt-form-section" aria-labelledby="visit-section-title">
            <div className="tt-form-section__heading">
              <Check aria-hidden="true" />
              <div>
                <h2 id="visit-section-title">방문 정보</h2>
                <p>리뷰 해석에 필요한 최소 정보만 받습니다.</p>
              </div>
            </div>
            <div className="tt-form-grid-2">
              <div className="tt-field">
                <Label htmlFor="visit_type">방문 유형</Label>
                <Select id="visit_type" name="visit_type" defaultValue="friends">
                  {VISIT_TYPES.map((visitType) => (
                    <option key={visitType} value={visitType}>{VISIT_TYPE_LABELS[visitType]}</option>
                  ))}
                </Select>
              </div>
              <div className="tt-field">
                <Label htmlFor="price_satisfaction">가격 만족도</Label>
                <Select id="price_satisfaction" name="price_satisfaction" defaultValue="fair">
                  {PRICE_SATISFACTION.map((value) => (
                    <option key={value} value={value}>{PRICE_SATISFACTION_LABELS[value]}</option>
                  ))}
                </Select>
              </div>
            </div>
            <div className="tt-field">
              <Label htmlFor="photo_url"><ImagePlus className="tt-icon-sm" aria-hidden="true" /> 사진 또는 영수증 URL</Label>
              <Input id="photo_url" name="photo_url" type="url" placeholder="https://" />
              <p className="tt-helper-text">MVP에서는 URL로 첨부하며, 검증 상태는 별도 기준에 따라 표시됩니다.</p>
            </div>
          </section>

          <div className="tt-review-submit">
            <span>제출 후 매장 점수와 리뷰 신호가 갱신됩니다.</span>
            <SubmitButton />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
