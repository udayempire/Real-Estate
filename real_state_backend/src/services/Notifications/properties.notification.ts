import { NotificationType, Prisma } from "@prisma/client";

type AcquisitionApprovalNotificationInput = {
    propertyId: string;
    propertyTitle: string;
};

export function buildAcquisitionApprovalNotification(input: AcquisitionApprovalNotificationInput): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.GENERIC,
        title: `Realbro is interested in your property: ${input.propertyTitle}`,
        description: `Reach us at Mail: contact@realbro.io | +91-80856-71414`,
        data: {
            action: "acquisition_request_approved",
            propertyId: input.propertyId,
            propertyTitle: input.propertyTitle,
            email: "contact@realbro.io",
            callUs: "+91-80856-71414",
        },
    };
}

export function unlistPropertyNotification(input: { propertyId: string; propertyTitle: string }): {
    type: NotificationType;
    title: string;
    description: string;
    data: Prisma.InputJsonValue;
} {
    return {
        type: NotificationType.GENERIC,
        title: "Action Required: Property Unlisted",
        description: `Your listing '${input.propertyTitle}' has been temporarily removed. Contact support to resolve this: contact@realbro.io | +91-80856-71414`,
        data: {
            action: "property_unlisted",
            propertyId: input.propertyId,
            propertyTitle: input.propertyTitle,
        },
    };
}

