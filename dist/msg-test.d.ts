declare function msg_test(seneca: any, spec: any): {
    (): Promise<void>;
    run: (seneca: any, spec: any, calls: any) => Promise<unknown>;
};
declare namespace msg_test {
    var MsgTest: typeof msg_test;
    var Joi: any;
    var LN: (t: any) => any;
    var intern: {
        ready: (seneca: any) => Promise<void>;
        error_view: (err: any) => any;
        where: (call: any) => string;
        run: (seneca: any, spec: any, calls: any) => Promise<unknown>;
        handle_delegate: (instance: any, call: any, callmap: any, spec: any) => any;
        missing_messages: (seneca: any, spec: any, calls: any) => void;
    };
}
export default msg_test;
