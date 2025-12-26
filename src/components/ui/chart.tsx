"use client";

import * as React from "react";
import * as RechartsPrimitive from "recharts";
import type { TooltipProps, LegendProps } from "recharts";

import { cn } from "./utils";

/* ----------------------------------
 * THEMES
 * ---------------------------------- */

const THEMES = {
    light: "",
    dark: ".dark",
} as const;

/* ----------------------------------
 * CONFIG TYPES
 * ---------------------------------- */

export type ChartConfig = {
    [key: string]: {
        label?: React.ReactNode;
        icon?: React.ComponentType;
    } & (
        | { color?: string; theme?: never }
        | { color?: never; theme: Record<keyof typeof THEMES, string> }
        );
};

type ChartContextProps = {
    config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

function useChart() {
    const context = React.useContext(ChartContext);
    if (!context) {
        throw new Error("useChart must be used within <ChartContainer />");
    }
    return context;
}

/* ----------------------------------
 * CONTAINER
 * ---------------------------------- */

// FIX: Re-implementing ChartContainer as forwardRef based on the previous working version
const ChartContainer = React.forwardRef<
    HTMLDivElement,
    React.ComponentProps<"div"> & {
    config: ChartConfig;
    children: React.ComponentProps<
        typeof RechartsPrimitive.ResponsiveContainer
    >["children"];
}
>(({ id, className, children, config, ...props }, ref) => {
    const uniqueId = React.useId();
    const chartId = `chart-${id ?? uniqueId.replace(/:/g, "")}`;

    return (
        <ChartContext.Provider value={{ config }}>
            <div
                data-slot="chart"
                data-chart={chartId}
                ref={ref}
                className={cn(
                    "flex aspect-video justify-center text-xs",
                    "[&_.recharts-layer]:outline-none",
                    // Adding default recharts styling classes from the first working version
                    "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-polar-grid_[stroke='#ccc']]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke='#ccc']]:stroke-border [&_.recharts-dot[stroke='#fff']]:stroke-transparent [&_.recharts-sector]:outline-hidden [&_.recharts-sector[stroke='#fff']]:stroke-transparent [&_.recharts-surface]:outline-hidden",
                    className
                )}
                {...props}
            >
                <ChartStyle id={chartId} config={config} />
                <RechartsPrimitive.ResponsiveContainer>
                    {children}
                </RechartsPrimitive.ResponsiveContainer>
            </div>
        </ChartContext.Provider>
    );
});
ChartContainer.displayName = "ChartContainer";

/* ----------------------------------
 * STYLE INJECTION
 * ---------------------------------- */

function ChartStyle({ id, config }: { id: string; config: ChartConfig }) {
    const entries = Object.entries(config).filter(
        ([, c]) => c.color || c.theme
    );

    if (!entries.length) return null;

    return (
        <style
            dangerouslySetInnerHTML={{
                __html: Object.entries(THEMES)
                    .map(
                        ([theme, prefix]) => `
${prefix} [data-chart="${id}"] {
${entries
                            .map(([key, cfg]) => {
                                const color =
                                    cfg.theme?.[theme as keyof typeof cfg.theme] ?? cfg.color;
                                return color ? `  --color-${key}: ${color};` : null;
                            })
                            .filter(Boolean)
                            .join("\n")}
}
`
                    )
                    .join("\n"),
            }}
        />
    );
}

/* ----------------------------------
 * TOOLTIP
 * ---------------------------------- */

// ... (rest of the file remains the same)

/* ----------------------------------
 * TOOLTIP
 * ---------------------------------- */

const ChartTooltip = RechartsPrimitive.Tooltip;

// Define specific payload item type to avoid 'any'
interface ChartTooltipPayloadItem {
    color?: string;
    dataKey: string | number;
    name?: string;
    value?: number | string | Array<number | string>;
    payload: Record<string, any>;
    fill?: string;
    [key: string]: any;
}

type ChartTooltipContentProps = TooltipProps<any, any> &
    React.HTMLAttributes<HTMLDivElement> & {
    hideLabel?: boolean;
    hideIndicator?: boolean;
    indicator?: "dot" | "line" | "dashed";
    nameKey?: string;
    labelKey?: string;
    // Recharts types often make `payload` and `label` optional, but we want them to be typed
    payload?: ChartTooltipPayloadItem[];
    label?: any;
    // FIX: Ensure formatter types are based on the specific payload item
    labelFormatter?: (label: any, payload: ChartTooltipPayloadItem[]) => React.ReactNode;
    formatter?: (
        value: any,
        name: any,
        item: ChartTooltipPayloadItem,
        index: number,
        payload: any
    ) => React.ReactNode;
};

const ChartTooltipContent = React.forwardRef<
    HTMLDivElement,
    ChartTooltipContentProps
>(
    (
        {
            active,
            payload,
            className,
            indicator = "dot",
            hideLabel = false,
            hideIndicator = false,
            label,
            labelFormatter,
            labelClassName,
            formatter,
            color,
            nameKey,
            labelKey,
            ...props
        },
        ref
    ) => {
        const { config } = useChart();
        const safePayload = payload as ChartTooltipPayloadItem[] | undefined;

        const tooltipLabel = React.useMemo(() => {
            if (hideLabel || !safePayload?.length) {
                return null;
            }

            const [item] = safePayload;
            const key = `${labelKey || item?.dataKey || item?.name || "value"}`;
            const itemConfig = getPayloadConfigFromPayload(config, item, key);
            const value =
                !labelKey && typeof label === "string"
                    ? config[label as keyof typeof config]?.label || label
                    : itemConfig?.label;

            if (labelFormatter) {
                // FIX: Ensure the correct array type is passed to labelFormatter
                return (
                    <div className={cn("font-medium", labelClassName)}>
                        {labelFormatter(value, safePayload)}
                    </div>
                );
            }

            if (!value) {
                return null;
            }

            return <div className={cn("font-medium", labelClassName)}>{value}</div>;
        }, [
            label,
            labelFormatter,
            safePayload,
            hideLabel,
            labelClassName,
            config,
            labelKey,
        ]);

        if (!active || !safePayload?.length) return null;

        const nestLabel = safePayload.length === 1 && indicator !== "dot";

        return (
            <div
                ref={ref}
                className={cn(
                    "bg-background border rounded-lg px-2.5 py-1.5 text-xs shadow-xl min-w-[8rem] items-start gap-1.5 grid border-border/50",
                    className
                )}
                {...props}
            >
                {!nestLabel ? tooltipLabel : null}
                <div className="grid gap-1.5">
                    {safePayload.map((item, index) => {
                        const key = `${nameKey || item.name || item.dataKey || "value"}`;
                        const itemConfig = getPayloadConfigFromPayload(config, item, key);
                        const indicatorColor = color || item.payload.fill || item.color;

                        return (
                            <div
                                key={item.dataKey || key}
                                className={cn(
                                    "[&>svg]:text-muted-foreground flex w-full flex-wrap items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5",
                                    indicator === "dot" && "items-center"
                                )}
                            >
                                {formatter && item?.value !== undefined && item.name ? (
                                    formatter(item.value, item.name, item, index, item.payload)
                                ) : (
                                    <>
                                        {itemConfig?.icon ? (
                                            <itemConfig.icon />
                                        ) : (
                                            !hideIndicator && (
                                                <div
                                                    className={cn(
                                                        "shrink-0 rounded-[2px]",
                                                        {
                                                            "h-2.5 w-2.5": indicator === "dot",
                                                            "w-1": indicator === "line",
                                                            "w-0 border-[1.5px] border-dashed bg-transparent":
                                                                indicator === "dashed",
                                                            "my-0.5": nestLabel && indicator === "dashed",
                                                        }
                                                    )}
                                                    style={
                                                        {
                                                            backgroundColor: indicator === 'dot' ? indicatorColor : undefined,
                                                            borderColor: indicatorColor,
                                                            borderWidth: indicator !== 'dot' ? '1.5px' : undefined,
                                                        } as React.CSSProperties
                                                    }
                                                />
                                            )
                                        )}
                                        <div
                                            className={cn(
                                                "flex flex-1 justify-between leading-none",
                                                nestLabel ? "items-end" : "items-center"
                                            )}
                                        >
                                            <div className="grid gap-1.5">
                                                {nestLabel ? tooltipLabel : null}
                                                <span className="text-muted-foreground">
                          {itemConfig?.label || item.name}
                        </span>
                                            </div>
                                            {item.value && (
                                                <span className="font-mono font-medium tabular-nums text-foreground">
                          {item.value.toLocaleString()}
                        </span>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }
);
ChartTooltipContent.displayName = "ChartTooltipContent";

/* ----------------------------------
 * LEGEND
 * ---------------------------------- */

const ChartLegend = RechartsPrimitive.Legend;

type ChartLegendContentProps = React.HTMLAttributes<HTMLDivElement> &
    Pick<LegendProps, "verticalAlign"> & {
    payload?: ChartTooltipPayloadItem[];
    hideIcon?: boolean;
    nameKey?: string;
};

const ChartLegendContent = React.forwardRef<
    HTMLDivElement,
    ChartLegendContentProps
>(
    (
        { className, payload, verticalAlign = "bottom", hideIcon = false, nameKey, ...props },
        ref
    ) => {
        const { config } = useChart();
        if (!payload?.length) return null;

        return (
            <div
                ref={ref}
                className={cn(
                    "flex justify-center gap-4",
                    verticalAlign === "top" ? "pb-3" : "pt-3",
                    className
                )}
                {...props}
            >
                {payload.map((item) => {
                    const key = `${nameKey || item.dataKey || "value"}`;
                    const itemConfig = getPayloadConfigFromPayload(config, item, key); // Use the correct helper

                    return (
                        <div
                            key={item.dataKey || item.name || key} // Safer key generation
                            className="flex items-center gap-1.5"
                        >
                            {itemConfig?.icon && !hideIcon ? (
                                <itemConfig.icon />
                            ) : (
                                <div
                                    className="h-2 w-2 shrink-0 rounded-[2px]"
                                    style={{
                                        backgroundColor: item.color,
                                    }}
                                />
                            )}
                            {itemConfig?.label}
                        </div>
                    );
                })}
            </div>
        );
    }
);
ChartLegendContent.displayName = "ChartLegendContent";

/* ----------------------------------
 * HELPERS
 * ---------------------------------- */

// FIX: Re-inserting the robust payload configuration helper
function getPayloadConfigFromPayload(
    config: ChartConfig,
    payload: unknown,
    key: string
) {
    if (typeof payload !== "object" || payload === null) {
        return undefined;
    }

    const payloadPayload =
        "payload" in payload &&
        typeof payload.payload === "object" &&
        payload.payload !== null
            ? payload.payload
            : undefined;

    let configLabelKey: string = key;

    if (
        key in payload &&
        typeof payload[key as keyof typeof payload] === "string"
    ) {
        configLabelKey = payload[key as keyof typeof payload] as string;
    } else if (
        payloadPayload &&
        key in payloadPayload &&
        typeof payloadPayload[key as keyof typeof payloadPayload] === "string"
    ) {
        configLabelKey = payloadPayload[
            key as keyof typeof payloadPayload
            ] as string;
    }

    return configLabelKey in config
        ? config[configLabelKey]
        : config[key as keyof typeof config];
}

/* ----------------------------------
 * EXPORTS
 * ---------------------------------- */

export {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
    ChartStyle,
};