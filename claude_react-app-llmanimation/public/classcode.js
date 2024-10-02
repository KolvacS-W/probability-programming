console.log('in class code')
window.House = class extends window.Rule {
    static doc = "a Victorian house in front of hills";
    static qualitative_params = ['height of hill', 'roof color'];
    static abstract_params = ['shape of windows'];
    // No constructor needed
};
