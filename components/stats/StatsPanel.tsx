"use client";

import { BustProbabilityChart } from "./BustProbabilityChart";
import { WinChanceChart } from "./WinChanceChart";
import { RiskHistoryChart } from "./RiskHistoryChart";
import { WinLossHistoryChart } from "./WinLossHistoryChart";
import { PerfectPlayChart } from "./PerfectPlayChart";
import { LuckHistoryChart } from "./LuckHistoryChart";

export function StatsPanel() {
	return (
		<div className="fixed right-0 top-0 h-full w-80 bg-[#095a2a] border-l border-[#00aa00] overflow-y-auto p-4 space-y-6 z-50">
			<div className="sticky top-0 bg-[#095a2a] pb-4 border-b border-[#00aa00]">
				<h2 className="text-lg font-bold text-[#ffff00]">Estatísticas</h2>
			</div>
			<div className="space-y-6">
				<BustProbabilityChart />
				<WinChanceChart />
				<RiskHistoryChart />
				<WinLossHistoryChart />
				<PerfectPlayChart />
				<LuckHistoryChart />
			</div>
		</div>
	);
}
