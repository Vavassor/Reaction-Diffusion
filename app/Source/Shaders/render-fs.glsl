precision mediump float;
uniform sampler2D state;
uniform vec2 state_size;

const float COLOR_MIN = 0.2;
const float COLOR_MAX = 0.4;

void main()
{
    float chemical_b = texture2D(state, gl_FragCoord.xy / state_size).y;
    float value = (COLOR_MAX - chemical_b) / (COLOR_MAX - COLOR_MIN);
    gl_FragColor = vec4(value, value, value, 1.0);
}