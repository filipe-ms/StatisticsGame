"use client";

import { RiskHistoryChart } from "./RiskHistoryChart";
import { WinLossHistoryChart } from "./WinLossHistoryChart";
import { LuckHistoryChart } from "./LuckHistoryChart";

export function StatsPanelRight() {
	return (
		<div className="fixed right-0 top-0 h-screen w-80 bg-[#095a2a] border-l-2 border-[#00aa00] overflow-y-auto p-3 space-y-4 z-50 shadow-2xl">
			<div className="sticky top-0 bg-[#095a2a] pb-3 border-b-2 border-[#00aa00] z-10">
				<h2 className="text-base font-bold text-[#ffff00] drop-shadow-[0_0_4px_rgba(255,255,0,0.5)]">
					Histórico
				</h2>
			</div>
			<div className="space-y-4">
				<RiskHistoryChart />
				<WinLossHistoryChart />
				<LuckHistoryChart />
			</div>
		</div>
	);
}
