"use client";

import { useEffect, useState } from "react";
import { StatisticsEmitter } from "@/app/game/shared/StatisticsEmitter";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";

const chartConfig = {
	risk: {
		label: "Risco (%)",
		color: "#aa0000",
	},
} satisfies import("@/components/ui/chart").ChartConfig;

export function RiskHistoryChart() {
	const [riskHistory, setRiskHistory] = useState<number[]>([]);

	useEffect(() => {
		const emitter = StatisticsEmitter.getInstance();
		const handleUpdate = (data: { riskHistory: number[] }) => {
			setRiskHistory([...data.riskHistory]);
		};

		emitter.on("riskHistory", handleUpdate);

		return () => {
			emitter.off("riskHistory", handleUpdate);
		};
	}, []);

	const chartData = riskHistory.map((risk, index) => ({
		play: index + 1,
		risk: risk * 100,
	}));

	return (
		<div className="w-full space-y-2 bg-[#0a4a1f] rounded-lg border-2 border-[#00aa00] p-3 shadow-lg">
			<h3 className="text-xs font-bold text-white drop-shadow-[0_0_3px_rgba(0,170,0,0.8)] uppercase tracking-wide">
				📊 Histórico de Risco
			</h3>
			<ChartContainer config={chartConfig} className="h-[140px]">
				<LineChart
					data={chartData}
					margin={{
						top: 5,
						right: 10,
						left: 10,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#00aa00" opacity={0.2} />
					<XAxis
						dataKey="play"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "600" }}
						label={{ value: "Jogada", position: "insideBottom", offset: -5, style: { fill: "#ffffff", fontSize: "10px", fontWeight: "bold" } }}
					/>
					<YAxis
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						domain={[0, 100]}
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "600" }}
						tickFormatter={(value) => `${value}%`}
					/>
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const data = payload[0];
							return (
								<ChartTooltipContent className="bg-[#0a4a1f] border-2 border-[#00aa00] shadow-lg">
									<div className="flex items-center gap-2">
										<span className="text-white text-xs font-bold">
											Jogada {data.payload.play}: {data.value?.toFixed(1)}%
										</span>
									</div>
								</ChartTooltipContent>
							);
						}}
					/>
					<Line
						type="monotone"
						dataKey="risk"
						stroke="#aa0000"
						strokeWidth={3}
						dot={{ r: 4, fill: "#aa0000", strokeWidth: 2, stroke: "#ffffff" }}
						activeDot={{ r: 6, fill: "#ff0000", strokeWidth: 2, stroke: "#ffffff" }}
					/>
				</LineChart>
			</ChartContainer>
			{riskHistory.length === 0 && (
				<div className="text-center text-[10px] text-white bg-[#0a4a1f] rounded px-2 py-1 border border-[#00aa00] opacity-80">
					Nenhum dado ainda
				</div>
			)}
		</div>
	);
}
