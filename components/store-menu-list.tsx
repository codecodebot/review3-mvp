import type { StoreMenu } from "@/lib/types";

type StoreMenuListProps = {
  menus: StoreMenu[];
};

function formatPrice(price: number | null) {
  return typeof price === "number" ? `${price.toLocaleString("ko-KR")}원` : "가격 미등록";
}

export function StoreMenuList({ menus }: StoreMenuListProps) {
  return (
    <div className="tt-menu-card">
      <div className="tt-menu-card__header">
        <div>
          <h2 className="tt-card-title">메뉴</h2>
          <p className="tt-card-description">매장에서 제공하는 대표 메뉴입니다.</p>
        </div>
        <span className="tt-badge tt-badge--muted">
          {menus.length}개
        </span>
      </div>

      <div className="tt-menu-card__content">
      {menus.length ? (
        <div className="tt-menu-list">
          {menus.map((menu) => (
            <div key={menu.id} className="tt-menu-item">
                <div>
                  <div className="tt-menu-item__title-row">
                    <div className="tt-menu-item__title">{menu.name}</div>
                    {menu.is_signature ? (
                      <span className="tt-badge tt-badge--warning tt-badge--compact">
                        대표
                      </span>
                    ) : null}
                  </div>
                  {menu.description ? (
                    <p className="tt-menu-item__description">{menu.description}</p>
                  ) : null}
                </div>
                <div className="tt-menu-item__price">
                  {formatPrice(menu.price)}
                </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="tt-empty-state">
          아직 등록된 메뉴가 없습니다.
        </div>
      )}
      </div>
    </div>
  );
}
