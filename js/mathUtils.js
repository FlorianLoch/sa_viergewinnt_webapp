(function() {
  window.MathUtil = {};
  MathUtil.getRandomPlaceOnCircle = function(iXm, iYm, iR) {
    function signum() {
      return Math.pow(-1, Math.floor(Math.random() * 100));
    }

    var x = signum() * Math.random() * iR;
    x = Math.round(x);
    var y = signum() * Math.sqrt(Math.pow(iR, 2) - Math.pow(x, 2));
    y = Math.round(y);

    return {
      x: iXm + x,
      y: iYm + y
    };
  };
})();
