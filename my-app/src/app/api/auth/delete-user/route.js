import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request) {
    try {
        const supabase = createClient()
        
        // Get the current user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized or user not found' },
                { status: 401 }
            )
        }

        // Delete the user using admin function
        const { error: deleteError } = await supabase.auth.admin.deleteUser(user.id)

        if (deleteError) {
            console.error('Error deleting user:', deleteError)
            return NextResponse.json(
                { error: 'Failed to delete user account' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
        
    } catch (error) {
        console.error('Unexpected error:', error)
        return NextResponse.json(
            { error: 'An unexpected error occurred' },
            { status: 500 }
        )
    }
}
