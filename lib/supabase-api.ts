import { supabase } from './supabase'

export interface Product {
    id: string
    title: string
    title_ar: string | null
    description: string | null
    description_ar: string | null
    sku: string
    category: string
    price: number
    compare_at_price: number | null
    stock: number
    status: string
    images: string[]
    benefits: string[] | null
    benefits_ar: string[] | null
    ingredients: string | null
    ingredients_ar: string | null
    how_to_use: string | null
    how_to_use_ar: string | null
    sales_count: number
    created_at: string
    updated_at: string
}

export interface Customer {
    id: string
    name: string
    email: string
    phone: string | null
    status: string
    total_orders: number
    total_spent: number
    created_at: string
    updated_at: string
}

export interface Order {
    id: string
    order_number: string
    customer_id: string | null
    customer_name: string
    customer_email: string
    customer_phone: string
    address_line1: string
    address_line2: string | null
    city: string
    governorate: string
    postal_code: string | null
    status: string
    subtotal: number
    shipping_cost: number
    total: number
    ip_address: string | null
    notes: string | null
    created_at: string
    updated_at: string
}

export interface OrderItem {
    id: string
    order_id: string
    product_id: string | null
    product_title: string
    product_sku: string
    product_image: string | null
    variant_name: string | null
    quantity: number
    price: number
    subtotal: number
    created_at: string
}

// Products API
export async function getProducts(filters?: {
    category?: string
    status?: string
    search?: string
    limit?: number
    offset?: number
}) {
    let query = supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false })

    if (filters?.category) {
        query = query.eq('category', filters.category)
    }

    if (filters?.status) {
        query = query.eq('status', filters.status)
    } else {
        // Default to active products only
        query = query.eq('status', 'active')
    }
    if (filters?.limit) {
        query = query.limit(filters.limit)
    }

    if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    if (filters?.search) {
        const searchTerm = `%${filters.search}%`
        const mainOrQuery = `title.ilike."${searchTerm}",title_ar.ilike."${searchTerm}",description.ilike."${searchTerm}",description_ar.ilike."${searchTerm}"`

        const { data, error: searchError } = await query.or(mainOrQuery)

        if (searchError) {
            // If Arabic columns are missing, fallback to English only search
            if (searchError.message?.includes('column "title_ar" does not exist') ||
                searchError.message?.includes('column "description_ar" does not exist')) {
                console.warn('Bilingual columns missing, falling back to English search.')

                // Re-build clean query for fallback
                let fallbackQueryBuilder = supabase
                    .from('products')
                    .select('*')
                    .order('created_at', { ascending: false })

                if (filters?.category) fallbackQueryBuilder = fallbackQueryBuilder.eq('category', filters.category)
                if (filters?.status) fallbackQueryBuilder = fallbackQueryBuilder.eq('status', filters.status)
                else fallbackQueryBuilder = fallbackQueryBuilder.eq('status', 'active')

                if (filters?.limit) fallbackQueryBuilder = fallbackQueryBuilder.limit(filters.limit)
                if (filters?.offset) fallbackQueryBuilder = fallbackQueryBuilder.range(filters.offset, filters.offset + (filters.limit || 10) - 1)

                const { data: fbData, error: fbError } = await fallbackQueryBuilder.or(`title.ilike."${searchTerm}",description.ilike."${searchTerm}"`)

                if (fbError) {
                    console.error('Search failed even with fallback:', fbError.message)
                    return []
                }
                return fbData as Product[]
            }

            console.error('Error fetching products:', searchError.message || searchError)
            return []
        }

        return data as Product[]
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching products:', error.message || error)
        return []
    }

    return data as Product[]
}

export async function getProductById(id: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        if (error.code === 'PGRST116') {
            console.warn(`Product with ID ${id} not found`)
            return null
        }
        console.error(`Error fetching product ${id}:`, error)
        return null
    }

    return data as Product
}

export async function getProductBySku(sku: string) {
    const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', sku)
        .single()

    if (error) {
        console.error('Error fetching product:', error)
        return null
    }

    return data as Product
}

export async function getRelatedProducts(productId: string, limit = 4) {
    const { data, error } = await supabase
        .from('product_cross_sells')
        .select(`
      related_product_id,
      products!product_cross_sells_related_product_id_fkey (*)
    `)
        .eq('product_id', productId)
        .limit(limit)

    if (error) {
        console.error('Error fetching related products:', error)
        return []
    }

    return (data.map(item => item.products) as unknown) as Product[]
}

// Orders API
export async function getOrders(filters?: {
    status?: string
    limit?: number
    offset?: number
}) {
    let query = supabase
        .from('orders')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

    if (filters?.status) {
        query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
        query = query.limit(filters.limit)
    }

    if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) {
        console.error('Error fetching orders:', error)
        return { data: [], count: 0 }
    }

    return {
        data: data as Order[],
        count: count || 0
    }
}

export async function getOrderById(id: string) {
    const { data, error } = await supabase
        .from('orders')
        .select(`
      *,
      order_items (*)
    `)
        .eq('id', id)
        .single()

    if (error) {
        console.error('Error fetching order:', error)
        return null
    }

    return data as (Order & { order_items: OrderItem[] })
}

export async function createOrder(data: {
    customer: {
        name: string
        email: string
        phone: string
        address_line1: string
        city: string
    }
    items: {
        product_id: string
        product_title: string
        product_sku: string
        quantity: number
        price: number
        subtotal: number
    }[]
    subtotal: number
    shipping_cost: number
    total: number
}) {
    // 1. Create or get customer
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .upsert({
            name: data.customer.name,
            email: data.customer.email,
            phone: data.customer.phone
        }, { onConflict: 'email' })
        .select()
        .single()

    if (customerError) {
        console.error('Error with customer record:', customerError)
    }

    // 2. Insert order
    const orderNumber = `ORD-${Math.floor(1000 + Math.random() * 9000)}`
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
            order_number: orderNumber,
            customer_id: customer?.id || null,
            customer_name: data.customer.name,
            customer_email: data.customer.email,
            customer_phone: data.customer.phone,
            address_line1: data.customer.address_line1,
            city: data.customer.city,
            governorate: 'Egypt', // Default for now
            status: 'pending',
            subtotal: data.subtotal,
            shipping_cost: data.shipping_cost,
            total: data.total
        })
        .select()
        .single()

    if (orderError) {
        console.error('Error creating order:', orderError)
        return { error: orderError }
    }

    // 3. Insert order items
    const orderItems = data.items.map(item => ({
        order_id: order.id,
        ...item
    }))

    const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems)

    if (itemsError) {
        console.error('Error creating order items:', itemsError)
        return { error: itemsError }
    }

    return { order }
}

export async function updateOrderStatus(orderId: string, status: string) {
    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        console.error('Error updating order status:', error)
        return { error }
    }

    return { data }
}
export async function getCustomers(filters?: {
    status?: string
    limit?: number
    offset?: number
}) {
    let query = supabase
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false })

    if (filters?.status) {
        query = query.eq('status', filters.status)
    }

    if (filters?.limit) {
        query = query.limit(filters.limit)
    }

    if (filters?.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching customers:', error)
        return []
    }

    return data as Customer[]
}

// Analytics API
export async function getDashboardStats() {
    // Get total revenue
    const { data: orders } = await supabase
        .from('orders')
        .select('total, status')

    const totalRevenue = orders?.reduce((sum, order) => sum + order.total, 0) || 0
    const completedOrders = orders?.filter(o => o.status === 'delivered').length || 0
    const pendingOrders = orders?.filter(o => o.status === 'pending' || o.status === 'processing').length || 0

    // Get total customers
    const { count: customerCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

    // Get total products
    const { count: productCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })

    return {
        totalRevenue,
        totalOrders: orders?.length || 0,
        completedOrders,
        pendingOrders,
        totalCustomers: customerCount || 0,
        totalProducts: productCount || 0
    }
}

export async function getRevenueAnalytics() {
    const { data: orders } = await supabase
        .from('orders')
        .select('total, created_at')
        .order('created_at', { ascending: true })

    if (!orders) return []

    // Group by day
    const revenueByDay: Record<string, number> = {}
    orders.forEach(order => {
        const date = new Date(order.created_at).toLocaleDateString('en-US', { weekday: 'short' })
        revenueByDay[date] = (revenueByDay[date] || 0) + order.total
    })

    return Object.entries(revenueByDay).map(([name, revenue]) => ({ name, revenue }))
}

export async function getTopProducts(limit = 5) {
    const { data: items } = await supabase
        .from('order_items')
        .select('product_title, quantity, subtotal')

    if (!items) return []

    // Group by product
    const products: Record<string, { sales: number, revenue: number }> = {}
    items.forEach(item => {
        if (!products[item.product_title]) {
            products[item.product_title] = { sales: 0, revenue: 0 }
        }
        products[item.product_title].sales += item.quantity
        products[item.product_title].revenue += item.subtotal
    })

    return Object.entries(products)
        .map(([name, stats]) => ({ name, ...stats }))
        .sort((a, b) => b.sales - a.sales)
        .slice(0, limit)
}

export async function getAdminSettings() {
    const { data, error } = await supabase
        .from('admin_settings')
        .select('key, value')

    if (error) {
        console.error('Error fetching admin settings:', error)
        return {}
    }

    const settings: Record<string, string> = {}
    data.forEach(item => {
        settings[item.key] = item.value
    })

    return settings
}

export async function updateAdminSettings(settings: Record<string, string>) {
    const updates = Object.entries(settings).map(([key, value]) => ({
        key,
        value,
        updated_at: new Date().toISOString()
    }))

    const { error } = await supabase
        .from('admin_settings')
        .upsert(updates, { onConflict: 'key' })

    if (error) {
        console.error('Error updating admin settings:', error)
        return { error }
    }

    return { success: true }
}

// ============================================================================
// Hero Carousel Management
// ============================================================================

export interface HeroCarouselItem {
    id: string
    position: number
    image_url: string
    title: string
    subtitle: string | null
    link: string | null
    is_active: boolean
    created_at: string
    updated_at: string
}

/**
 * Get all hero carousel items ordered by position
 */
export async function getHeroCarouselItems(admin = false): Promise<HeroCarouselItem[]> {
    let query = supabase
        .from('hero_carousel')
        .select('*')
        .order('position', { ascending: true })

    if (!admin) {
        query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching hero carousel items:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
        })
        return []
    }

    return data || []
}

/**
 * Update a hero carousel item
 */
export async function updateHeroCarouselItem(
    id: string,
    updates: Partial<Pick<HeroCarouselItem, 'title' | 'subtitle' | 'image_url' | 'is_active' | 'link'>>
): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('hero_carousel')
        .update(updates)
        .eq('id', id)

    if (error) {
        console.error('Error updating hero carousel item:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Add a new hero carousel item
 */
export async function addHeroCarouselItem(item: {
    title: string;
    subtitle?: string;
    image_url: string;
    link?: string;
    position: number;
    is_active?: boolean;
}): Promise<{ success: boolean; data?: HeroCarouselItem; error?: string }> {
    const { data, error } = await supabase
        .from('hero_carousel')
        .insert({
            ...item,
            is_active: item.is_active ?? true
        })
        .select()
        .single()

    if (error) {
        console.error('Error adding hero carousel item:', error)
        return { success: false, error: error.message }
    }

    return { success: true, data: data as HeroCarouselItem }
}

/**
 * Delete a hero carousel item
 */
export async function deleteHeroCarouselItem(id: string): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
        .from('hero_carousel')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting hero carousel item:', error)
        return { success: false, error: error.message }
    }

    return { success: true }
}

/**
 * Upload hero carousel image to Supabase Storage
 */
export async function uploadHeroCarouselImage(
    file: File,
    position: number
): Promise<{ success: boolean; url?: string; error?: string }> {
    try {
        const fileExt = file.name.split('.').pop()
        const fileName = `hero-carousel-${position}-${Date.now()}.${fileExt}`
        const filePath = `hero-carousel/${fileName}`

        const { error: uploadError } = await supabase.storage
            .from('product-images')
            .upload(filePath, file, { upsert: true })

        if (uploadError) {
            console.error('Error uploading image:', uploadError)
            return { success: false, error: uploadError.message }
        }

        const { data: { publicUrl } } = supabase.storage
            .from('product-images')
            .getPublicUrl(filePath)

        return { success: true, url: publicUrl }
    } catch (error) {
        console.error('Error in uploadHeroCarouselImage:', error)
        return { success: false, error: 'Failed to upload image' }
    }
}

/**
 * Reorder hero carousel items
 */
export async function reorderHeroCarousel(
    items: Array<{ id: string; position: number }>
): Promise<{ success: boolean; error?: string }> {
    try {
        // Update each item's position
        const updates = items.map(item =>
            supabase
                .from('hero_carousel')
                .update({ position: item.position })
                .eq('id', item.id)
        )

        const results = await Promise.all(updates)
        const hasError = results.some(result => result.error)

        if (hasError) {
            return { success: false, error: 'Failed to reorder some items' }
        }

        return { success: true }
    } catch (error) {
        console.error('Error reordering carousel:', error)
        return { success: false, error: 'Failed to reorder carousel' }
    }
}

export async function getCategories() {
    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name')

    if (error) {
        console.error('Error fetching categories:', error)
        return []
    }

    return data as { id: string, name: string, slug: string, name_ar?: string }[]
}
