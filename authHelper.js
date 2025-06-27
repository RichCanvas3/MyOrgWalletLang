import axios from 'axios';

export const Authorization = () => {
    return `https://www.linkedin.com/oauth/v2/authorization?client_id=${process.env.LINKEDIN_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.LINKEDIN_REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent('r_liteprofile r_emailaddress')}`;
};

export const Redirect = async (code) => {
    try {
        console.log('ID:', process.env.LINKEDIN_CLIENT_ID);
        console.log('SECRET:', process.env.LINKEDIN_CLIENT_SECRET);
        console.log('REDIRECT:', process.env.LINKEDIN_REDIRECT_URI);
        // Exchange code for access token
        const tokenResponse = await axios.post(
            'https://www.linkedin.com/oauth/v2/accessToken',
            new URLSearchParams({
                grant_type: 'authorization_code',
                code: code,
                redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
                client_id: process.env.LINKEDIN_CLIENT_ID,
                client_secret: process.env.LINKEDIN_CLIENT_SECRET,
            }),
            {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );
        const accessToken = tokenResponse.data.access_token;
        console.log('accessToken: '+ accessToken);

        // Fetch user info
        const userInfoResponse = await axios.get('https://api.linkedin.com/v2/me', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log('userInfoResponse: ' + userInfoResponse);

        const emailResponse = await axios.get('https://api.linkedin.com/v2/emailAddress?q=members&projection=(elements*(handle~))', {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });

        console.log('emailResponse: ' + emailResponse)

        return {
            access_token: accessToken,
            user: userInfoResponse.data,
            email: emailResponse.data,
        };
    } catch (error) {
        return { error: error.message, details: error.response?.data };
    }
};
