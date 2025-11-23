"use client";

import { useEffect, useState } from "react";
import { StatisticsEmitter } from "@/app/game/shared/StatisticsEmitter";
import {
	ChartContainer,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell } from "recharts";

const chartConfig = {
	perfect: {
		label: "Jogadas Perfeitas",
		color: "#00aa00",
	},
	imperfect: {
		label: "Jogadas Imperfeitas",
		color: "#aa0000",
	},
} satisfies import("@/components/ui/chart").ChartConfig;

export function PerfectPlayChart() {
	const [perfectPlayPercent, setPerfectPlayPercent] = useState<number>(0);
	const [totalDecisions, setTotalDecisions] = useState<number>(0);

	useEffect(() => {
		const emitter = StatisticsEmitter.getInstance();
		const handleUpdate = (data: {
			perfectPlayPercent: number;
			totalDecisions: number;
		}) => {
			setPerfectPlayPercent(data.perfectPlayPercent);
			setTotalDecisions(data.totalDecisions);
		};

		emitter.on("perfectPlay", handleUpdate);

		return () => {
			emitter.off("perfectPlay", handleUpdate);
		};
	}, []);

	const perfectPercent = perfectPlayPercent * 100;
	const imperfectPercent = (1 - perfectPlayPercent) * 100;

	const data = [
		{
			name: "Perfeitas",
			value: perfectPercent,
			fill: "#00aa00",
		},
		{
			name: "Imperfeitas",
			value: imperfectPercent,
			fill: "#aa0000",
		},
	];

	return (
		<div className="w-full space-y-2 bg-[#0a4a1f] rounded-lg border-2 border-[#00aa00] p-3 shadow-lg">
			<h3 className="text-xs font-bold text-white drop-shadow-[0_0_3px_rgba(0,170,0,0.8)] uppercase tracking-wide">
				⭐ Jogadas Perfeitas (Basic Strategy)
			</h3>
			<ChartContainer config={chartConfig} className="h-[140px]">
				<BarChart
					data={data}
					layout="vertical"
					margin={{
						top: 5,
						right: 10,
						left: 50,
						bottom: 5,
					}}
				>
					<CartesianGrid strokeDasharray="3 3" stroke="#00aa00" opacity={0.2} />
					<XAxis
						type="number"
						domain={[0, 100]}
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "600" }}
						tickFormatter={(value) => `${value}%`}
					/>
					<YAxis
						type="category"
						dataKey="name"
						tickLine={false}
						axisLine={false}
						tickMargin={8}
						width={45}
						tick={{ fill: "#ffffff", fontSize: 11, fontWeight: "bold" }}
					/>
					<ChartTooltip
						content={({ active, payload }) => {
							if (!active || !payload?.length) return null;
							const data = payload[0];
							return (
								<ChartTooltipContent className="bg-[#0a4a1f] border-2 border-[#00aa00] shadow-lg">
									<div className="flex items-center gap-2">
										<span className="text-white text-xs font-bold">
											{data.payload.name}: {data.value?.toFixed(1)}%
										</span>
									</div>
								</ChartTooltipContent>
							);
						}}
					/>
					<Bar dataKey="value" radius={[0, 4, 4, 0]}>
						{data.map((entry, index) => (
							<Cell key={`cell-${index}`} fill={entry.fill} />
						))}
					</Bar>
				</BarChart>
			</ChartContainer>
			<div className="text-center text-[10px] space-y-1">
				<div className="text-white font-bold bg-[#0a4a1f] rounded px-2 py-1 border border-[#00aa00]">
					{perfectPercent.toFixed(1)}% Perfeito
				</div>
				<div className="text-white text-[9px] opacity-80">
					{totalDecisions} decisões totais
				</div>
			</div>
		</div>
	);
}
