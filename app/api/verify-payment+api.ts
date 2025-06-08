import crypto from 'crypto';

export async function POST(request: Request) {
  try {
    const { razorpay_payment_id, razorpay_order_id, razorpay_signature } = await request.json();
    
    // Verify the payment signature
    const razorpayKeySecret = 'HdKKd3kWSGYGNOBPqj163BJb';
    
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(body.toString())
      .digest('hex');
    
    const isValid = expectedSignature === razorpay_signature;
    
    if (isValid) {
      // Payment is verified - you can now update the database
      // and activate the user's subscription
      
      return Response.json({
        success: true,
        verified: true,
        payment_id: razorpay_payment_id
      });
    } else {
      return Response.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }
    
  } catch (error) {
    console.error('Payment verification error:', error);
    return Response.json(
      { success: false, error: 'Verification failed' },
      { status: 500 }
    );
  }
}