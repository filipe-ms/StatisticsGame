"use client";

import { CurrentStateRadarChart } from "./CurrentStateRadarChart";
import { BustProbabilityChart } from "./BustProbabilityChart";
import { WinChanceChart } from "./WinChanceChart";
import { PerfectPlayChart } from "./PerfectPlayChart";

export function StatsPanelLeft() {
	return (
		<div className="fixed left-0 top-0 h-screen w-80 bg-[#095a2a] border-r-2 border-[#00aa00] overflow-y-auto p-3 space-y-4 z-50 shadow-2xl">
			<div className="sticky top-0 bg-[#095a2a] pb-3 border-b-2 border-[#00aa00] z-10">
				<h2 className="text-base font-bold text-[#ffff00] drop-shadow-[0_0_4px_rgba(255,255,0,0.5)]">
					Estado Atual
				</h2>
			</div>
			<div className="space-y-4">
				<CurrentStateRadarChart />
				<BustProbabilityChart />
				<WinChanceChart />
				<PerfectPlayChart />
			</div>
		</div>
	);
}
