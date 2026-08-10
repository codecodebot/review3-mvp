import { createStoreAction } from "@/app/actions/stores";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  STORE_CATEGORIES,
  STORE_REGIONS,
  formatCategoryLabel,
  formatRegionLabel
} from "@/lib/constants";

const MENU_ROWS = Array.from({ length: 6 }, (_, index) => index);

export function StoreRegistrationForm() {
  return (
    <form action={createStoreAction} className="space-y-8">
      <section className="rounded-3xl border border-zinc-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">기본 정보</h2>
          <p className="mt-1 text-sm text-zinc-500">등록 후 기존 매장과 동일하게 리뷰와 TT Score가 적용됩니다.</p>
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">매장명</Label>
            <Input id="name" name="name" required placeholder="예: 구로 브루잉 카페" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Select id="category" name="category" required defaultValue="Korean">
              {STORE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {formatCategoryLabel(category)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="region">지역</Label>
            <Select id="region" name="region" required defaultValue="Seoul Guro">
              {STORE_REGIONS.map((region) => (
                <option key={region} value={region}>
                  {formatRegionLabel(region)}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="address">주소</Label>
            <Textarea id="address" name="address" placeholder="도로명 주소를 입력해 주세요." />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lat">위도</Label>
            <Input id="lat" name="lat" type="number" step="0.000001" placeholder="37.495000" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lng">경도</Label>
            <Input id="lng" name="lng" type="number" step="0.000001" placeholder="126.887000" />
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-zinc-200 bg-white p-6">
        <div>
          <h2 className="text-lg font-semibold text-zinc-950">대표 메뉴</h2>
          <p className="mt-1 text-sm text-zinc-500">비워 둔 행은 저장하지 않습니다.</p>
        </div>
        <div className="mt-6 space-y-4">
          {MENU_ROWS.map((index) => (
            <div key={index} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
              <div className="grid gap-3 md:grid-cols-[1fr_140px_120px]">
                <div className="space-y-2">
                  <Label htmlFor={`menu-name-${index}`}>메뉴명</Label>
                  <Input id={`menu-name-${index}`} name="menu_name" placeholder="예: 대표 메뉴" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`menu-price-${index}`}>가격</Label>
                  <Input id={`menu-price-${index}`} name="menu_price" inputMode="numeric" placeholder="12000" />
                </div>
                <label className="flex items-end gap-2 pb-2 text-sm font-medium text-zinc-700">
                  <Input
                    type="checkbox"
                    name="menu_signature"
                    value={index}
                    className="h-4 w-4"
                  />
                  대표 메뉴
                </label>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor={`menu-description-${index}`}>설명</Label>
                  <Input
                    id={`menu-description-${index}`}
                    name="menu_description"
                    placeholder="간단한 설명을 입력해 주세요."
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="flex justify-end">
        <Button type="submit" size="lg">
          매장 등록
        </Button>
      </div>
    </form>
  );
}
