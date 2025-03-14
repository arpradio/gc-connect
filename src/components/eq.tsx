"use client";

import React, { useState, useRef, useEffect } from 'react';

interface DialProps {
    value: number;
    min: number;
    max: number;
    step: number;
    onChange: (value: number) => void;
    size?: number;
    colorTrack?: string;
    colorPositive?: string;
    colorNegative?: string;
    label?: string;
    valueLabel?: string;
}

const Dial: React.FC<DialProps> = ({
    value,
    min,
    max,
    step,
    onChange,
    size = 80,
    colorTrack = 'rgba(51, 51, 51, 0.6)',
    colorPositive = '#f59e0b',
    colorNegative = '#ef4444',
    label,
    valueLabel
}): React.ReactElement => {
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const dialRef = useRef<HTMLDivElement>(null);
    const startYRef = useRef<number>(0);
    const startValueRef = useRef<number>(0);

    const isNegative: boolean = value < 0;
    const activeColor: string = isNegative ? colorNegative : colorPositive;

    // Arc constants - keep 0 at 12 o'clock for arcs
    const ZERO_ANGLE: number = -90;
    const RANGE: number = 270;
    const START_ANGLE: number = ZERO_ANGLE - (RANGE / 2);
    const END_ANGLE: number = ZERO_ANGLE + (RANGE / 2);

    const hasZero: boolean = min < 0 && max > 0;
    const zeroNormalized: number = hasZero ? -min / (max - min) : 0;
    const zeroAngle: number = START_ANGLE + (zeroNormalized * RANGE);

    const normalizedValue: number = (value - min) / (max - min);
    const valueAngle: number = START_ANGLE + (normalizedValue * RANGE);

    // Rotated needle position (90 degrees clockwise from arc position)
    const ROTATION_OFFSET: number = 90;
    const needleAngle: number = valueAngle + ROTATION_OFFSET;

    const centerX: number = size / 2;
    const centerY: number = size / 2;
    const radius: number = (size / 2) - 4;

    const toRad = (deg: number): number => (deg * Math.PI) / 180;

    const getPointAtAngle = (angle: number): { x: number; y: number } => ({
        x: centerX + radius * Math.cos(toRad(angle)),
        y: centerY + radius * Math.sin(toRad(angle))
    });

    const createArc = (startAng: number, endAng: number, sweep: number): string => {
        const start: { x: number; y: number } = getPointAtAngle(startAng);
        const end: { x: number; y: number } = getPointAtAngle(endAng);
        const largeArc: number = Math.abs(endAng - startAng) > 180 ? 1 : 0;
        return `M ${start.x},${start.y} A ${radius},${radius} 0 ${largeArc} ${sweep} ${end.x},${end.y}`;
    };

    const backgroundPath: string = createArc(START_ANGLE, END_ANGLE, 1);

    let activePath: string;
    if (hasZero) {
        if (isNegative) {
            activePath = createArc(zeroAngle, valueAngle, 0);
        } else {
            activePath = createArc(zeroAngle, valueAngle, 1);
        }
    } else {
        activePath = createArc(START_ANGLE, valueAngle, 1);
    }

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent): void => {
            if (!isDragging) return;

            const deltaY: number = startYRef.current - e.clientY;
            const sensitivity: number = (max - min) / 200;
            const newValue: number = Math.min(max, Math.max(min, startValueRef.current + deltaY * sensitivity));
            const roundedValue: number = Math.round(newValue / step) * step;

            onChange(roundedValue);
        };

        const handleTouchMove = (e: TouchEvent): void => {
            if (!isDragging) return;

            const deltaY: number = startYRef.current - e.touches[0].clientY;
            const sensitivity: number = (max - min) / 200;
            const newValue: number = Math.min(max, Math.max(min, startValueRef.current + deltaY * sensitivity));
            const roundedValue: number = Math.round(newValue / step) * step;

            onChange(roundedValue);
        };

        const handleEnd = (): void => {
            setIsDragging(false);
        };

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('touchmove', handleTouchMove, { passive: false });
            document.addEventListener('mouseup', handleEnd);
            document.addEventListener('touchend', handleEnd);
        }

        return (): void => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('touchmove', handleTouchMove);
            document.removeEventListener('mouseup', handleEnd);
            document.removeEventListener('touchend', handleEnd);
        };
    }, [isDragging, min, max, step, onChange]);

    const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>): void => {
        e.preventDefault();
        setIsDragging(true);
        startYRef.current = e.clientY;
        startValueRef.current = value;
    };

    const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
        if (e.cancelable) {
            e.preventDefault();
        }
        setIsDragging(true);
        startYRef.current = e.touches[0].clientY;
        startValueRef.current = value;
    };

    return (
        <div className="flex flex-col items-center">
            {label && <div className="text-xs text-zinc-400 mb-1">{label}</div>}
            <div
                ref={dialRef}
                className="relative cursor-pointer select-none"
                style={{ width: `${size}px`, height: `${size}px` }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
            >
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    <path
                        d={backgroundPath}
                        fill="none"
                        stroke={colorTrack}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    <path
                        d={activePath}
                        fill="none"
                        stroke={activeColor}
                        strokeWidth="4"
                        strokeLinecap="round"
                    />

                    {hasZero && (
                        <circle
                            cx={getPointAtAngle(zeroAngle).x}
                            cy={getPointAtAngle(zeroAngle).y}
                            r="2"
                            fill="white"
                        />
                    )}
                </svg>

                <div
                    className="absolute bg-zinc-200 rounded-full shadow-md transform -translate-x-1/2 -translate-y-1/2"
                    style={{
                        width: `${size / 3}px`,
                        height: `${size / 3}px`,
                        top: '50%',
                        left: '50%',
                    }}
                >
                    <div
                        className="absolute w-1 h-1/3 bg-zinc-700 rounded-full transform -translate-x-1/2"
                        style={{
                            top: '2px',
                            left: '50%',
                            transformOrigin: 'bottom center',
                            transform: `translateX(-50%) rotate(${needleAngle}deg)`
                        }}
                    />
                </div>
            </div>
            {valueLabel && <div className="text-xs text-amber-400 mt-2">{valueLabel}</div>}
        </div>
    );
};

export default Dial;