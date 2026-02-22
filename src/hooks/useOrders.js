import { useMutation, useQueryClient } from '@tanstack/react-query';
import { orderAPI } from '../api/orders';

// Helper to recalc totalAmount from items
const recalcTotal = (items = []) => items.reduce((s, it) => s + (it.priceAtTime || 0) * (it.count || 0), 0);

export function useIncreaseItem() {
    const qc = useQueryClient();
    return useMutation(({ orderId, productId, count = 1 }) => orderAPI.increaseItem(orderId, productId, count), {
        async onMutate({ orderId, productId, count = 1 }) {
            await Promise.all([
                qc.cancelQueries(['orders']),
                qc.cancelQueries(['orders', 'my-active']),
                qc.cancelQueries(['order', orderId]),
            ]);

            const previousOrders = qc.getQueryData(['orders']);
            const previousMy = qc.getQueryData(['orders', 'my-active']);
            const previousDetail = qc.getQueryData(['order', orderId]);

            const patch = (data) => {
                if (!data) return data;
                return data.map((o) => {
                    if (o.id !== orderId) return o;
                    const items = (o.items || []).map((it) =>
                        it.productId === productId ? { ...it, count: (it.count || 0) + count } : it
                    );
                    return { ...o, items, totalAmount: recalcTotal(items) };
                });
            };

            const patchDetail = (d) => {
                if (!d) return d;
                const items = (d.items || []).map((it) =>
                    it.productId === productId ? { ...it, count: (it.count || 0) + count } : it
                );
                return { ...d, items, totalAmount: recalcTotal(items) };
            };

            qc.setQueryData(['orders'], (old) => patch(old));
            qc.setQueryData(['orders', 'my-active'], (old) => patch(old));
            qc.setQueryData(['order', orderId], (old) => patchDetail(old));

            return { previousOrders, previousMy, previousDetail };
        },
        onError(err, variables, context) {
            qc.setQueryData(['orders'], context.previousOrders);
            qc.setQueryData(['orders', 'my-active'], context.previousMy);
            qc.setQueryData(['order', variables.orderId], context.previousDetail);
        },
        onSettled(_, __, variables) {
            qc.invalidateQueries(['orders']);
            qc.invalidateQueries(['orders', 'my-active']);
            qc.invalidateQueries(['order', variables.orderId]);
        },
    });
}

export function useDecreaseItem() {
    const qc = useQueryClient();
    return useMutation(({ orderId, productId, count = 1, aboutOfCancelled = '' }) =>
        orderAPI.decreaseItem(orderId, productId, count, aboutOfCancelled), {
        async onMutate({ orderId, productId, count = 1 }) {
            await Promise.all([
                qc.cancelQueries(['orders']),
                qc.cancelQueries(['orders', 'my-active']),
                qc.cancelQueries(['order', orderId]),
            ]);

            const previousOrders = qc.getQueryData(['orders']);
            const previousMy = qc.getQueryData(['orders', 'my-active']);
            const previousDetail = qc.getQueryData(['order', orderId]);

            const patch = (data) => {
                if (!data) return data;
                return data.map((o) => {
                    if (o.id !== orderId) return o;
                    const items = (o.items || [])
                        .map((it) => (it.productId === productId ? { ...it, count: Math.max(0, (it.count || 0) - count) } : it))
                        .filter((it) => (it.count || 0) > 0);
                    return { ...o, items, totalAmount: recalcTotal(items) };
                });
            };

            const patchDetail = (d) => {
                if (!d) return d;
                const items = (d.items || [])
                    .map((it) => (it.productId === productId ? { ...it, count: Math.max(0, (it.count || 0) - count) } : it))
                    .filter((it) => (it.count || 0) > 0);
                return { ...d, items, totalAmount: recalcTotal(items) };
            };

            qc.setQueryData(['orders'], (old) => patch(old));
            qc.setQueryData(['orders', 'my-active'], (old) => patch(old));
            qc.setQueryData(['order', orderId], (old) => patchDetail(old));

            return { previousOrders, previousMy, previousDetail };
        },
        onError(err, variables, context) {
            qc.setQueryData(['orders'], context.previousOrders);
            qc.setQueryData(['orders', 'my-active'], context.previousMy);
            qc.setQueryData(['order', variables.orderId], context.previousDetail);
        },
        onSettled(_, __, variables) {
            qc.invalidateQueries(['orders']);
            qc.invalidateQueries(['orders', 'my-active']);
            qc.invalidateQueries(['order', variables.orderId]);
        },
    });
}

// Stubs for other mutations (can be extended similarly)
export function useChangeStatus() {
    const qc = useQueryClient();
    return useMutation(({ orderId, status }) => orderAPI.changeStatus(orderId, status), {
        onSuccess: (_, vars) => {
            qc.invalidateQueries(['orders']);
            qc.invalidateQueries(['orders', 'my-active']);
            qc.invalidateQueries(['order', vars.orderId]);
        },
    });
}

export function useChangeTable() {
    const qc = useQueryClient();
    return useMutation(({ orderId, newTableId }) => orderAPI.changeTable(orderId, newTableId), {
        onSuccess: (_, vars) => {
            qc.invalidateQueries(['orders']);
            qc.invalidateQueries(['orders', 'my-active']);
            qc.invalidateQueries(['order', vars.orderId]);
        },
    });
}

export function useCreateOrder() {
    const qc = useQueryClient();
    return useMutation((data) => orderAPI.create(data), {
        onSuccess: () => qc.invalidateQueries(['orders']),
    });
}

export function useDeleteOrder() {
    const qc = useQueryClient();
    return useMutation((orderId) => orderAPI.delete(orderId), {
        onSuccess: () => qc.invalidateQueries(['orders']),
    });
}
