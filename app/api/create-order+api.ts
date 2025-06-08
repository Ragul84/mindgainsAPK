import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { amount, currency = 'INR' } = await request.json();
    
    // Validate input
    if (!amount || amount <= 0) {
      return Response.json(
        { success: false, error: 'Invalid amount' },
        { status: 400 }
      );
    }
    
    // Create order with Razorpay API
    const razorpayKeyId = 'rzp_live_bRQ1kn9flQesUR';
    const razorpayKeySecret = 'HdKKd3kWSGYGNOBPqj163BJb';
    
    const orderData = {
      amount: amount * 100, // Convert to paise
      currency,
      receipt: `receipt_${Date.now()}`,
    };
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Razorpay API error:', errorData);
      throw new Error('Failed to create Razorpay order');
    }
    
    const order = await response.json();
    
    return Response.json({
      success: true,
      order
    });
    
  } catch (error) {
    console.error('Order creation error:', error);
    return Response.json(
      { success: false, error: 'Failed to create order' },
      { status: 500 }
    );
  }
}