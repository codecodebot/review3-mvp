import type { StoreMenu } from "@/lib/types";

type StoreMenuListProps = {
  menus: StoreMenu[];
};

function formatPrice(price: number | null) {
  return typeof price === "number" ? `${price.toLocaleString("ko-KR")}원` : "가격 미등록";
}

export function StoreMenuList({ menus }: StoreMenuListProps) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950">메뉴</h2>
          <p className="mt-1 text-xs text-zinc-500">매장에서 제공하는 대표 메뉴입니다.</p>
        </div>
        <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-semibold text-zinc-500">
          {menus.length}개
        </span>
      </div>

      {menus.length ? (
        <div className="mt-4 divide-y divide-zinc-100">
          {menus.map((menu) => (
            <div key={menu.id} className="py-4 first:pt-0 last:pb-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-zinc-950">{menu.name}</div>
                    {menu.is_signature ? (
                      <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                        대표
                      </span>
                    ) : null}
                  </div>
                  {menu.description ? (
                    <p className="mt-1 text-sm leading-6 text-zinc-500">{menu.description}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-sm font-semibold tabular-nums text-zinc-950">
                  {formatPrice(menu.price)}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
          아직 등록된 메뉴가 없습니다.
        </div>
      )}
    </div>
  );
}
