exports.noSpecialCharsNoWhiteSpacesAtTheStartAndAtTheEndRegex =
  /^(?!\s)(?!.*\s{2})[a-zA-Z0-9\s]*\w$/;

  exports.onlyAlphaNumericsAndUnderscores =
  /^[a-zA-Z0-9_]*$/;

exports.passwordRegex =
  /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[!@#$%^&*()_+~`\-={}[\]\\|:;"'<>,.?/])[A-Za-z\d!@#$%^&*()_+~`\-={}[\]\\|:;"'<>,.?/]{6,}$/;
