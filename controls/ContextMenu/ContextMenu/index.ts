import * as React from 'react';
import { IInputs, IOutputs } from './generated/ManifestTypes';
import { InputEvents, ManifestPropertyNames, TextAlignmentTypes } from './ManifestConstants';
import { ContextEx } from './ContextExtended';

import { CanvasContextMenu } from './components/CanvasContextMenu';
import { getMenuItemsFromDataset } from './components/DatasetMapping';
import { CanvasContextMenuItem, CanvasContextMenuProps } from './components/Component.types';

export class ContextMenu implements ComponentFramework.ReactControl<IInputs, IOutputs> {
    notifyOutputChanged: () => void;
    inputEvent?: string | null;
    context: ComponentFramework.Context<IInputs>;
    items: CanvasContextMenuItem[];
    focusKey = '';

    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void): void {
        this.notifyOutputChanged = notifyOutputChanged;
        this.context = context;
        this.context.mode.trackContainerResize(true);
        this.context.parameters.items.paging.setPageSize(500);
    }

    public updateView(context: ComponentFramework.Context<IInputs>): React.ReactElement {
        const inputEvent = this.context.parameters.InputEvent.raw;
        const eventChanged = inputEvent && this.inputEvent !== inputEvent;

        if (eventChanged && inputEvent.startsWith(InputEvents.SetFocus)) {
            // Simulate SetFocus until this is unlocked by the platform
            this.focusKey = inputEvent;
        }

        const dataset = context.parameters.items;
        const datasetChanged = context.updatedProperties.indexOf(ManifestPropertyNames.dataset) > -1 || !this.items;

        if (datasetChanged) {
            this.items = getMenuItemsFromDataset(dataset);
        }

        // The test harness provides width/height as strings
        const allocatedWidth = parseInt(context.mode.allocatedWidth as unknown as string);
        const allocatedHeight = parseInt(context.mode.allocatedHeight as unknown as string);
        const tabIndex = (context as unknown as ContextEx).accessibility?.assignedTabIndex ?? undefined;
        const textAlignment = context.parameters.TextAlignment.raw;
        const props = {
            tabIndex: tabIndex,
            width: allocatedWidth,
            height: allocatedHeight,
            items: this.items,
            onSelected: this.onSelect,
            disabled: context.mode.isControlDisabled,
            setFocus: this.focusKey,
            themeJSON: context.parameters.Theme.raw,
            showChevron: this.context.parameters.Chevron.raw !== false,
            iconColor: undefinedIfEmpty(context.parameters.IconColor),
            iconSize: undefinedIfZero(context.parameters.IconSize),
            hoverIconColor: undefinedIfEmpty(context.parameters.HoverIconColor),
            fontSize: undefinedIfZero(context.parameters.FontSize),
            fontColor: undefinedIfEmpty(context.parameters.FontColor),
            hoverFontColor: undefinedIfEmpty(context.parameters.HoverFontColor),
            borderColor: undefinedIfEmpty(context.parameters.BorderColor),
            hoverBorderColor: undefinedIfEmpty(context.parameters.HoverBorderColor),
            borderRadius: undefinedIfEmpty(context.parameters.BorderRadius),
            fillColor: undefinedIfEmpty(context.parameters.FillColor),
            hoverFillColor: undefinedIfEmpty(context.parameters.HoverFillColor),
            justify: TextAlignmentTypes[textAlignment],
        } as CanvasContextMenuProps;

        return React.createElement(CanvasContextMenu, props);
    }

    public getOutputs(): IOutputs {
        return {} as IOutputs;
    }

    public destroy(): void {
        //noop
    }

    onSelect = (item?: CanvasContextMenuItem): void => {
        // Since there is no way of raising the OnSelect event without a named reference,
        // We store the root context menu item in the dataset to enable the OnSelect to be raised
        if (item && item.data) {
            this.context.parameters.items.openDatasetItem(item.data.getNamedReference());
        }
    };
}

function undefinedIfEmpty(property: ComponentFramework.PropertyTypes.Property) {
    return defaultIfEmpty(property, undefined);
}

function defaultIfEmpty<T>(property: ComponentFramework.PropertyTypes.Property, defaultValue: T) {
    return (property.raw as T) ? property.raw : defaultValue;
}

function undefinedIfZero(property: ComponentFramework.PropertyTypes.Property) {
    return property.raw && property.raw > 0 ? property.raw : undefined;
}
