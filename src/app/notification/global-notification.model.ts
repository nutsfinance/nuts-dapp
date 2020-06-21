export class GlobalNotificationModel {
    constructor(public notificationId: string, public subscriptionId: string, public instrumentId: string,
        public sequenceNumber: number, public creationTimestamp: number, public expireTimestamp: number,
        public message: string, public metadata: {[key: string]: string}) {}
}