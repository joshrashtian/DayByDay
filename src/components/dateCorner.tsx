import { useRef, useState, type PointerEvent } from "react";
import { WeatherBadge } from "./WeatherBadge";
import { useWeather } from "../hooks/useWeather";
import { useStyle } from "../providers/StyleProvider";
import { useContextMenu } from "../providers/ContextMenuProvider";
import { IoSunnyOutline } from "react-icons/io5";
import { IoMdClock } from "react-icons/io";

type Props = {
  variant?: string;
  rootClassName?: string;
};

export const DateCorner = ({ rootClassName }: Props) => {
  const today = new Date();
  const [variant, setVariant] = useState<string | undefined>(undefined);
  const { style, getClockStyle } = useStyle();
  const resolvedVariant = variant ?? style ?? "minimal";
  const stylePrototype = getClockStyle(resolvedVariant);
  const weather = useWeather();
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef(0);
  const dragStartScale = useRef(1);
  const context = useContextMenu();
  const clampScale = (value: number) => Math.min(2, Math.max(0.65, value));

  const onResizeStart = (event: PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();
    dragStartY.current = event.clientY;
    dragStartScale.current = scale;
    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onResizeMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    const deltaY = event.clientY - dragStartY.current;
    setScale(clampScale(dragStartScale.current + deltaY * 0.004));
  };

  const onResizeEnd = (event: PointerEvent<HTMLButtonElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const weekday = today
    .toLocaleDateString("en-US", { weekday: "long" })
    .toUpperCase();
  const month = today.getMonth() + 1;
  const day = today.getDate().toString().padStart(2, "0");

  const root = rootClassName ?? stylePrototype.rootClassName;
  const wrapperClassName = `${stylePrototype.wrapperClassName} ${
    isDragging ? "" : stylePrototype.wrapperIdleClassName
  }`;

  const onContextMenu = (e: React.MouseEvent<HTMLDivElement>) =>
    context.openMenu(e, [
      {
        id: "Header1",
        type: "header",
        header: "Clock Styles",
      },
      {
        id: "Default",
        label: "Default",
        onSelect: () => setVariant("minimal"),
        icon: <IoMdClock />,
        type: "item",
      },

      {
        id: "P5",
        label: "Persona 5 Style",
        onSelect: () => setVariant("p5"),
        type: "item",
      },
      {
        id: "Minimal",
        label: "Minimal",
        onSelect: () => setVariant("basic"),
        icon: <IoSunnyOutline />,
        type: "item",
      },
      {
        id: "Break1",
        type: "break",
      },
      {
        id: "Header2",
        type: "header",
        header: "Clock Size",
      },
      {
        id: "Small",
        label: "Small",
        onSelect: () => setScale(0.65),
        type: "item",
      },
      {
        id: "Medium",
        label: "Medium",
        onSelect: () => setScale(1),
        type: "item",
      },
      {
        id: "Large",
        label: "Large",
        onSelect: () => setScale(1.5),
        type: "item",
      },
    ]);

  if (stylePrototype.template === "p5") {
    return (
      <div className={root}>
        <div
          onContextMenu={onContextMenu}
          className={wrapperClassName}
          style={{
            transform: `scale(${scale})`,
            transformOrigin: stylePrototype.transformOrigin,
          }}
        >
          <div className={stylePrototype.dateRowClassName}>
            <div className={stylePrototype.dateRowCardClassName}>
              <div className={stylePrototype.dateRowCardInnerClassName}>
                <span className={stylePrototype.dateTextClassName}>
                  <span className={stylePrototype.monthClassName}>
                    {month}/
                  </span>
                  <span className={stylePrototype.dayClassName}>{day}</span>
                </span>
              </div>
            </div>
          </div>
          <div className={stylePrototype.weekdayRowClassName}>
            <span className={stylePrototype.weekdayClassName}>{weekday}</span>
            <WeatherBadge
              weather={weather}
              compact
              className={stylePrototype.weatherClassName}
              iconClassName={stylePrototype.weatherIconClassName}
              temperatureClassName={stylePrototype.weatherTemperatureClassName}
            />
          </div>

          <button
            type="button"
            className={stylePrototype.resizeHandleClassName}
            aria-label="Resize date corner"
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={root} onContextMenu={onContextMenu}>
      <div
        className={wrapperClassName}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: stylePrototype.transformOrigin,
        }}
      >
        <div className={stylePrototype.dateRowClassName}>
          <span
            className={stylePrototype.dateRowOverlayClassName}
            aria-hidden
          />
          <span className={stylePrototype.dateTextClassName}>
            <span className={stylePrototype.monthClassName}>{month}/</span>
            <span className={stylePrototype.dayClassName}>{day}</span>
          </span>
        </div>
        <div className={stylePrototype.weekdayRowClassName}>
          <h3 className={stylePrototype.weekdayClassName}>{weekday}</h3>
          <WeatherBadge
            weather={weather}
            compact
            className={stylePrototype.weatherClassName}
            iconClassName={stylePrototype.weatherIconClassName}
            temperatureClassName={stylePrototype.weatherTemperatureClassName}
          />
        </div>

        <button
          type="button"
          className={stylePrototype.resizeHandleClassName}
          aria-label="Resize date corner"
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeEnd}
        />
      </div>
    </div>
  );
};
