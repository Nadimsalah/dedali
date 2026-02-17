-- Allow delivery men to see order items for their assigned orders
DROP POLICY IF EXISTS "Delivery men can view order items of their orders" ON public.order_items;
CREATE POLICY "Delivery men can view order items of their orders" 
ON public.order_items 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_items.order_id 
        AND orders.delivery_man_id = auth.uid()
    )
);

-- Ensure orders policy is robust
DROP POLICY IF EXISTS "Delivery men can view their assigned orders" ON public.orders;
CREATE POLICY "Delivery men can view their assigned orders" 
ON public.orders 
FOR SELECT 
USING (auth.uid() = delivery_man_id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'ACCOUNT_MANAGER'))));

-- Allow updates for both drivers and admins/managers
DROP POLICY IF EXISTS "Delivery men can update their assigned orders" ON public.orders;
CREATE POLICY "Delivery men can update their assigned orders" 
ON public.orders 
FOR UPDATE 
USING (auth.uid() = delivery_man_id OR (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND (role = 'ADMIN' OR role = 'ACCOUNT_MANAGER'))));

-- 4. Allow delivery men to interact with order_status_logs
DROP POLICY IF EXISTS "Delivery men can view logs for their assigned orders" ON public.order_status_logs;
CREATE POLICY "Delivery men can view logs for their assigned orders" 
ON public.order_status_logs 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_status_logs.order_id 
        AND orders.delivery_man_id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Delivery men can insert logs for their assigned orders" ON public.order_status_logs;
CREATE POLICY "Delivery men can insert logs for their assigned orders" 
ON public.order_status_logs 
FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.orders 
        WHERE orders.id = order_id 
        AND orders.delivery_man_id = auth.uid()
    )
);

-- 5. Fix the Status Logging Trigger itself (Crucial)
-- We set it to SECURITY DEFINER so it ignores RLS for the tables it modifies
-- We also add EXCEPTION catching so a logging failure doesn't block the order update
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO public.order_status_logs (order_id, changed_by, old_status, new_status)
        VALUES (NEW.id, auth.uid(), OLD.status, NEW.status);
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Failed to log order status change: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
