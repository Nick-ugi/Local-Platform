import type { ReactNode } from "react";
import { SearchBox } from "@/components/search/SearchBox";

/** Explore and its categories. A phone has the search box at the top of the screen (m-explore). */
export default function ExploreLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Wider screens have the search box in the top menu. */}
      <div className="px-4 pt-2 md:hidden">
        <SearchBox />
      </div>
      {children}
    </>
  );
}
