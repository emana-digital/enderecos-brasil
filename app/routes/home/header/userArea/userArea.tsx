import type { FC } from "react";
import { UserCircle } from "@phosphor-icons/react/dist/ssr";

export const UserArea: FC = () => {
  return (
    <div>
      <UserCircle size={42} weight="fill" color="#999999" />
    </div>
  );
};
