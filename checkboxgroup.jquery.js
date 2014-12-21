/*global document, define, jQuery */
'use strict';
(function (factory) {
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }
}(function ($) {
    var doIt = function (opts) {
        var $box = $(this),
            $items = $('input[type="checkbox"]', $box),
            labels = [],
            topLevelObjects = [],
            $labels,
            $topLevelObjects,
            prevIdx = 0,
            setChecked,
            getInputForObject,
            mouseActive = false,
            mouseMoved,
            mouseChecked,
            startIdx;

        if (!opts) {
            opts = {};
        }

        $items.each(function () {
            var $this = $(this),
                $label;

            if (this.id) {
                $label = $('label[for="' + this.id + '"]');
            }
            if (!$label) {
                $label = $this.closest('label');
            }
            if ($label) {
                labels.push($label);
                topLevelObjects.push($label);
                if ($this.parents().index($label) === -1) {
                    topLevelObjects.push($this);
                }
            } else {
                topLevelObjects.push($this);
            }
        });
        $labels = $(labels).map(function () { return this.toArray(); });
        $topLevelObjects = $(topLevelObjects).map(function () { return this.toArray(); });

        setChecked = function (begin, end, checked) {
            $items.slice(begin, end).each(function () {
                if (this.checked !== checked) {
                    $(this).trigger('click');
                }
            });
        };

        getInputForObject = function (obj) {
            if (obj.nodeName === "INPUT") {
                return $(obj);
            }

            var forAttr = $(obj).attr('for'),
                input = document.getElementById(forAttr);
            if (!input) {
                input = $('input[type="checkbox"]', obj).get(0);
            }
            return $(input);
        };

        $items.click(function (e) {
            var idx = $items.index(this),
                a,
                b;

            if (e.shiftKey) {
                if (idx <= prevIdx) {
                    a = idx;
                    b = prevIdx;
                } else {
                    a = prevIdx;
                    b = idx;
                }
                setChecked(a, b + 1, this.checked);
            }
            prevIdx = idx;

            e.stopPropagation();
        });

        $labels.click(function (e) {
            if (e.originalEvent.detail <= 1) {
                return;
            }

            getInputForObject(this).click();
            e.preventDefault();
        });

        $topLevelObjects.mousedown(function (e) {
            var $input = getInputForObject(this),
                idx = $items.index($input);

            startIdx = idx;

            mouseChecked = !$input.get(0).checked;
            mouseMoved = false;
            mouseActive = true;

            e.preventDefault();
        });

        $box.mouseover(function (e) {
            if (!mouseActive) {
                return;
            }

            var $target = $(e.target),
                idx = $items.index($target),
                findRelated,
                $input,
                $label,
                inputIdx,
                labelIdx;

            findRelated = function ($target, $items) {
                var $ret = $target.find($items).add($target.closest($items));
                if ($ret.length === 0 && opts.itemSelector) {
                    $ret = $target.closest(opts.itemSelector).find($items);
                }
                return $ret;
            };

            if (idx === -1) {
                $input = findRelated($target, $items);
                $label = findRelated($target, $labels);
                if ($input.length > 1 || $label.length > 1) {
                    return; // ambiguous target
                }
                if ($input.length === 1 && $label.length === 1) {
                    inputIdx = $items.index($input);
                    labelIdx = $labels.index($label);
                    if (inputIdx === labelIdx) {
                        idx = inputIdx;
                    }
                } else if ($input.length === 1) {
                    idx = $items.index($input);
                } else if ($label.length === 1) {
                    idx = $labels.index($label);
                }
            }
            if (idx === -1) {
                return;
            }

            if (!mouseMoved) {
                prevIdx = startIdx;
                mouseMoved = true;
            }

            if (prevIdx >= startIdx && idx >= prevIdx) {
                // console.log('move down');
                setChecked(prevIdx, idx + 1, mouseChecked);
            } else if (prevIdx <= startIdx && idx < prevIdx) {
                // console.log('move up');
                setChecked(idx, prevIdx + 1, mouseChecked);
            } else if (prevIdx >= startIdx && idx < prevIdx) {
                // console.log('recover up');
                if (idx >= startIdx) {
                    setChecked(idx + 1, prevIdx + 1, !mouseChecked);
                } else {
                    setChecked(startIdx + 1, prevIdx + 1, !mouseChecked);
                    setChecked(idx, startIdx + 1, mouseChecked);
                }
            } else if (prevIdx <= startIdx && idx > prevIdx) {
                // console.log('recover down');
                if (idx <= startIdx) {
                    setChecked(prevIdx, idx, !mouseChecked);
                } else {
                    setChecked(prevIdx, startIdx, !mouseChecked);
                    setChecked(startIdx, idx + 1, mouseChecked);
                }
            }

            prevIdx = idx;
        });

        $(document).mouseup(function () {
            if (!mouseActive) {
                return;
            }

            mouseActive = false;
        });
    };

    $.fn.checkboxgroup = function (opts) {
        return this.each(function () {
            doIt.call(this, opts);
        });
    };
}));
