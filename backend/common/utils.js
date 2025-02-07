function generateSecureUniqueID(length = 11) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let id = '';
    const randomValues = new Uint8Array(length);

    crypto.getRandomValues(randomValues); // Generate secure random bytes

    randomValues.forEach(value => {
        id += chars[value % chars.length]; // Map values to character set
    });

    return id;
}
function generateBase64ID(length = 11) {
    return btoa(String.fromCharCode(...crypto.getRandomValues(new Uint8Array(length))))
        .replace(/[+/=]/g, '') // Remove URL-unsafe characters
        .slice(0, length);
}

// console.log(generateBase64ID()); // Example output: "AqZtX1pJmNv"
export { generateSecureUniqueID };