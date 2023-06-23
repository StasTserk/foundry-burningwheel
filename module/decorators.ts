export const gmOnly: MethodDecorator = (
    _target,
    _propertyKey,
    descriptor: PropertyDescriptor
) => {
    const functionCall = descriptor.value;
    descriptor.value = function (...args) {
        if (!game.user?.isGM) {
            return;
        }
        return functionCall.apply(this, args);
    };
};
