/*
 * Copyright (c) 2014, 2015 Qualcomm Technologies Inc
 *
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without modification, are permitted
 * (subject to the limitations in the disclaimer below) provided that the following conditions are
 * met:
 *
 * Redistributions of source code must retain the above copyright notice, this list of conditions
 * and the following disclaimer.
 *
 * Redistributions in binary form must reproduce the above copyright notice, this list of conditions
 * and the following disclaimer in the documentation and/or other materials provided with the
 * distribution.
 *
 * Neither the name of Qualcomm Technologies Inc nor the names of its contributors may be used to
 * endorse or promote products derived from this software without specific prior written permission.
 *
 * NO EXPRESS OR IMPLIED LICENSES TO ANY PARTY'S PATENT RIGHTS ARE GRANTED BY THIS LICENSE. THIS
 * SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY EXPRESS OR IMPLIED
 * WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS
 * FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE
 * LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA,
 * OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
 * CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
 * THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

import { postToMain } from "../worker-code.js";

export class Gamepad {
    static get ID_UNASSOCIATED() { return -1; };
    static get ID_SYNTHETIC() { return -2; };

    /* public enum Type & LegacyType not implemented */

    #user;

    constructor() {
        this.type = "UNKNOWN";

        this.left_stick_x = 0.0;
        this.left_stick_y = 0.0;
        this.right_stick_x = 0.0;
        this.right_stick_y = 0.0;

        this.dpad_up = false;
        this.dpad_down = false;
        this.dpad_left = false;
        this.dpad_right = false;

        this.a = false;
        this.b = false;
        this.x = false;
        this.y = false;

        this.guide = false;
        this.start = false;
        this.back = false;

        this.left_bumper = false;
        this.right_bumper = false;
        this.left_stick_button = false;
        this.right_stick_button = false;
        this.left_trigger = false;
        this.right_trigger = false;

        this.circle = false;
        this.cross = false;
        this.triangle = false;
        this.square = false;

        this.share = false;
        this.options = false;

        this.touchpad = false;
        this.touchpad_finger_1;
        this.touchpad_finger_2;
        this.touchpad_finger_1_x;
        this.touchpad_finger_1_y;
        this.touchpad_finger_2_x;
        this.touchpad_finger_2_y;

        this.ps = false;

        this.#user = Gamepad.ID_UNASSOCIATED; // controller 1 or 2
        
        this.id = Gamepad.ID_UNASSOCIATED; // id assigned by OS

        this.timestamp = 0; // timestamp of the last time an event was detected
    }

    getUser() {
        return this.#user;
    }
    setUser(userID) {
        this.#user = userID;
    }

    /* userForEffects workaround not needed */

    setGamepadId(id) {
        this.id = id;
    }
    getGamepadId() {
        return this.id;
    }

    setTimestamp(timestamp) {
        this.timestamp = timestamp;
    }
    refreshTimestamp() {
        this.setTimestamp(Date.now())
    }

    copy(gamepad) {
        this.fromGamepadState(gamepad.toGamepadState());
    }

    reset() {
        this.copy(new Gamepad());
    }

    /* robocol replaced with gamepadState */
    
    toGamepadState() {
        return {
            id: this.id,
            timestamp: this.timestamp,
            left_stick_x: this.left_stick_x,
            left_stick_y: this.left_stick_y,
            right_stick_x: this.right_stick_x,
            right_stick_y: this.right_stick_y,
            left_trigger: this.left_trigger,
            right_trigger: this.right_trigger,
            touchpad_finger_1: this.touchpad_finger_1,
            touchpad_finger_2: this.touchpad_finger_2,
            touchpad: this.touchpad,
            left_stick_button: this.left_stick_button,
            right_stick_button: this.right_stick_button,
            dpad_up: this.dpad_up,
            dpad_down: this.dpad_down,
            dpad_left: this.dpad_left,
            dpad_right: this.dpad_right,
            a: this.a,
            b: this.b,
            x: this.x,
            y: this.y,
            guide: this.guide,
            start: this.start,
            back: this.back,
            left_bumper: this.left_bumper,
            right_bumper: this.right_bumper,
            user: this.#user,
            touchpad_finger_1_x: this.touchpad_finger_1_x,
            touchpad_finger_1_y: this.touchpad_finger_1_y,
            touchpad_finger_2_x: this.touchpad_finger_2_x,
            touchpad_finger_2_y: this.touchpad_finger_2_y
        };
    }

    fromGamepadState(gamepadState) {
        this.id = gamepadState.id;
        this.timestamp = gamepadState.timestamp;
        this.left_stick_x = gamepadState.left_stick_x;
        this.left_stick_y = gamepadState.left_stick_y;
        this.right_stick_x = gamepadState.right_stick_x;
        this.right_stick_y = gamepadState.right_stick_y;
        this.left_trigger = gamepadState.left_trigger;
        this.right_trigger = gamepadState.right_trigger;
        this.touchpad_finger_1 = gamepadState.touchpad_finger_1;
        this.touchpad_finger_2 = gamepadState.touchpad_finger_2;
        this.touchpad = gamepadState.touchpad;
        this.left_stick_button = gamepadState.left_stick_button;
        this.right_stick_button = gamepadState.right_stick_button;
        this.dpad_up = gamepadState.dpad_up;
        this.dpad_down = gamepadState.dpad_down;
        this.dpad_left = gamepadState.dpad_left;
        this.dpad_right = gamepadState.dpad_right;
        this.a = gamepadState.a;
        this.b = gamepadState.b;
        this.x = gamepadState.x;
        this.y = gamepadState.y;
        this.guide = gamepadState.guide;
        this.start = gamepadState.start;
        this.back = gamepadState.back;
        this.left_bumper = gamepadState.left_bumper;
        this.right_bumper = gamepadState.right_bumper;
        this.#user = gamepadState.user;
        this.touchpad_finger_1_x = gamepadState.touchpad_finger_1_x;
        this.touchpad_finger_1_y = gamepadState.touchpad_finger_1_y;
        this.touchpad_finger_2_x = gamepadState.touchpad_finger_2_x;
        this.touchpad_finger_2_y = gamepadState.touchpad_finger_2_y;

        this.#updateButtonAliases();
    }

    atRest() {
        return (
            this.left_stick_x == 0 && this.left_stick_y == 0 &&
            this.right_stick_x == 0 && this.right_stick_y == 0 &&
            this.left_trigger == 0 && this.right_trigger == 0);
    }

    /* .type() not implemented due to variable name conflict, use .type instead */

    legacyType() {
        return this.type;
    }

    toString() {
        switch (this.type) {
            case "SONY_PS4":
            case "SONY_PS4_SUPPORTED_BY_KERNEL":
                return this.#ps4ToString();
            case "UNKNOWN":
            case "LOGITECH_F310":
            case "XBOX_360":
            default:
                return this.#genericToString();
        }
    }

    #ps4ToString() {
        let buttons = "";
        if (dpad_up) buttons += "dpad_up ";
        if (dpad_down) buttons += "dpad_down ";
        if (dpad_left) buttons += "dpad_left ";
        if (dpad_right) buttons += "dpad_right ";
        if (cross) buttons += "cross ";
        if (circle) buttons += "circle ";
        if (square) buttons += "square ";
        if (triangle) buttons += "triangle ";
        if (ps) buttons += "ps ";
        if (share) buttons += "share ";
        if (options) buttons += "options ";
        if (touchpad) buttons += "touchpad ";
        if (left_bumper) buttons += "left_bumper ";
        if (right_bumper) buttons += "right_bumper ";
        if (left_stick_button) buttons += "left stick button ";
        if (right_stick_button) buttons += "right stick button ";

        return String.format("ID: %2d user: %2d lx: % 1.2f ly: % 1.2f rx: % 1.2f ry: % 1.2f lt: %1.2f rt: %1.2f %s",
            this.id, this.#user, this.left_stick_x, this.left_stick_y,
            this.right_stick_x, this.right_stick_y, this.left_trigger, this.right_trigger, buttons);
    }

    #genericToString() {
        let buttons = "";
        if (this.dpad_up) buttons += "dpad_up ";
        if (this.dpad_down) buttons += "dpad_down ";
        if (this.dpad_left) buttons += "dpad_left ";
        if (this.dpad_right) buttons += "dpad_right ";
        if (this.a) buttons += "a ";
        if (this.b) buttons += "b ";
        if (this.x) buttons += "x ";
        if (this.y) buttons += "y ";
        if (this.guide) buttons += "guide ";
        if (this.start) buttons += "start ";
        if (this.back) buttons += "back ";
        if (this.left_bumper) buttons += "left_bumper ";
        if (this.right_bumper) buttons += "right_bumper ";
        if (this.left_stick_button) buttons += "left stick button ";
        if (this.right_stick_button) buttons += "right stick button ";

        return String.format("ID: %2d user: %2d lx: % 1.2f ly: % 1.2f rx: % 1.2f ry: % 1.2f lt: %1.2f rt: %1.2f %s",
            this.id, this.#user, this.left_stick_x, this.left_stick_y,
            this.right_stick_x, this.right_stick_y, this.left_trigger, this.right_trigger, buttons);
    }

    /* LedEffect and RumbleEffect not implemented */

    #updateButtonAliases() {
        // There is no assignment for touchpad because there is no equivalent on XBOX controllers.
        this.circle = this.b;
        this.cross = this.a;
        this.triangle = this.y;
        this.square = this.x;
        this.share = this.back;
        this.options = this.start;
        this.ps = this.guide;
    }
}